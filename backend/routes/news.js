'use strict';

/**
 * 新闻接口（替代已停服的百度百家）
 * ------------------------------------------------------------------
 * 采用「多源中文 RSS 聚合」：服务端并发抓取若干开源、免 key 的中文资讯 RSS
 * （爱范儿 / 极客公园 / IT之家 / 少数派），解析标题/链接/摘要/配图/来源/时间，
 * 混排去重后返回。字段与旧 baijia 保持一致，便于前端最小改动：
 *   [{ ID, m_title, m_image_url, m_summary, m_url, m_source, m_published }]
 *
 * 接口：
 *   getnews.php          -> 聚合新闻列表（JSON）
 *   getnews_content.php  -> 原文正文抓取（JSON：{ok, html}），详情页直接显示全文；
 *                           抓取/解析失败返回 {ok:false}，前端回退摘要+阅读原文
 *
 * 远端全部失败回退本地 mock（旧 baijia 结构一致）。
 *
 * 如需改用 freenewsapi.ai（国际多源，免 key）等其它聚合源，把下方 parseFeed /
 * fetchFeed 替换为对应实现即可；也可在 LK_NEWS_FEEDS 里增减 RSS 源。
 */
const config = require('../config');
const mock = require('../mock');
const { getCurl } = require('../http');
const { sendJSON } = require('../reply');

// 默认中文 RSS 源（开源、免 key，可自由增删）
const DEFAULT_FEEDS = [
  { url: 'https://www.ifanr.com/feed', source: '爱范儿' },
  { url: 'https://www.geekpark.net/rss', source: '极客公园' },
  { url: 'https://www.ithome.com/rss/', source: 'IT之家' },
  { url: 'https://sspai.com/feed', source: '少数派' }
];

/* ----------------------- RSS 解析（零依赖正则） ----------------------- */
function decodeEntities(s) {
  return (s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
}
function stripHtml(s) {
  return decodeEntities(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function pickTitle(e) {
  const m = e.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : '';
}
function pickLink(e) {
  let m = e.match(/<link>([\s\S]*?)<\/link>/i);
  if (m) return decodeEntities(m[1]).trim();
  m = e.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
  if (m) return decodeEntities(m[1]);
  return '';
}
function pickDate(e) {
  const m = e.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) ||
    e.match(/<published>([\s\S]*?)<\/published>/i) ||
    e.match(/<updated>([\s\S]*?)<\/updated>/i) ||
    e.match(/<dc:date>([\s\S]*?)<\/dc:date>/i);
  return m ? decodeEntities(m[1]).trim() : '';
}
function pickText(e, tag) {
  const re = new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i');
  const m = e.match(re);
  return m ? stripHtml(m[1]) : '';
}

// 正文全文：优先 content:encoded / content（Atom），其次 description
// （IT之家 description 为转义后的全文 HTML，极客公园/爱范儿为全文 HTML，
//   少数派仅摘要——由调用方按字数判断是否可用）
function pickContent(e) {
  let m = e.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i) ||
    e.match(/<content[^>]*>([\s\S]*?)<\/content>/i) ||
    e.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
  return m ? decodeEntities(m[1]) : '';
}
function pickImage(e) {
  let m = e.match(/<media:content[^>]*url="([^"]+)"/i) ||
    e.match(/<media:thumbnail[^>]*url="([^"]+)"/i);
  if (m) return decodeEntities(m[1]);
  // enclosure：兼容 url 在 type 前/后的两种顺序
  m = e.match(/<enclosure[^>]*type="image[^"]*"[^>]*url="([^"]+)"/i) ||
    e.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image[^"]*"/i);
  if (m) return decodeEntities(m[1]);
  m = e.match(/<img[^>]*src="([^"]+)"/i);
  if (m) return decodeEntities(m[1]);
  return '';
}
function parseFeed(xml, source) {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ||
    xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  const out = [];
  for (const it of items) {
    const title = pickTitle(it);
    const url = pickLink(it);
    if (!title || !url) continue;
    let summary = pickText(it, 'description') ||
      pickText(it, 'summary') ||
      pickText(it, 'content:encoded') ||
      pickText(it, 'content');
    if (summary.length > 140) summary = summary.slice(0, 140) + '…';
    out.push({
      ID: url,
      m_title: title,
      m_image_url: pickImage(it),
      m_summary: summary,
      m_url: url,
      m_source: source,
      m_published: pickDate(it),
      m_content: pickContent(it)
    });
  }
  return out;
}

async function fetchFeed(feed) {
  try {
    const xml = await getCurl(feed.url);
    return parseFeed(xml, feed.source);
  } catch (e) {
    console.warn('[news] 源失败 ' + feed.source + ': ' + e.message);
    return [];
  }
}

async function getNewsList(req, res, query) {
  const feeds = (config.NEWS_RSS_FEEDS && config.NEWS_RSS_FEEDS.length)
    ? config.NEWS_RSS_FEEDS : DEFAULT_FEEDS;
  try {
    const results = await Promise.all(feeds.map(fetchFeed));
    let merged = [].concat(...results);
    if (merged.length) {
      // 打散顺序，取前 N 条
      merged.sort(() => Math.random() - 0.5);
      merged = merged.slice(0, config.NEWS_SIZE || 30);
      // 用 feed 自带全文预热正文缓存（详情页可直接取用，见 getNewsContent）
      for (const it of merged) {
        cacheRssContent(it.m_url, it.m_content);
      }
      // 列表响应剔除 m_content，保持负载轻量
      const list = merged.map(it => ({
        ID: it.ID,
        m_title: it.m_title,
        m_image_url: it.m_image_url,
        m_summary: it.m_summary,
        m_url: it.m_url,
        m_source: it.m_source,
        m_published: it.m_published
      }));
      return sendJSON(res, list);
    }
  } catch (e) {
    console.warn('[news] 聚合失败，回退本地: ' + e.message);
  }
  return sendJSON(res, mock.getBaijiaList());
}

/* ======================= 原文正文（详情页直接显示全文） ======================= */
/*
 * 详情页全文数据三级查找（零依赖，全部正则/字符串处理）：
 *   1. RSS 全文缓存：爱范儿/极客公园/IT之家的 feed 自带全文（content:encoded 或
 *      description），列表聚合时已清洗入缓存；冷缓存时补拉一次 feed 按路径匹配
 *   2. 页面抓取：feed 仅摘要的源（如少数派）或爱范儿 JS 渲染页——抓文章页 HTML，
 *      按候选选择器定位正文容器（平衡标签提取），白名单清洗后返回
 *   3. 都失败 -> {ok:false}，前端回退「摘要 + 阅读原文」
 * 清洗规则：只保留 p、img、标题、列表、引用、表格、链接等；丢脚本、iframe、样式、
 * 广告分享相关推荐等容器；img 处理懒加载占位与相对地址；链接强制 noopener。
 * 结果按 url 内存缓存（TTL 30 分钟，最多 100 篇）。
 */

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const CACHE_TTL = 30 * 60 * 1000;
const CACHE_MAX = 100;
const articleCache = new Map();  // url -> {html, ts}  页面抓取结果
const rssContentCache = new Map(); // url -> {html, ts}  feed 全文

function cacheGet(cache, key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.html;
  if (hit) cache.delete(key);
  return null;
}
function cacheSet(cache, key, html) {
  cache.set(key, { html: html, ts: Date.now() });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value); // 淘汰最早一条
}

// feed 全文 -> 清洗后入 RSS 缓存（字数不够的摘要不缓存，走页面抓取）
function cacheRssContent(url, rawContent) {
  if (!url || !rawContent) return;
  if (cacheGet(rssContentCache, url)) return;
  const html = sanitizeHtml(rawContent, url);
  if (plainText(html).length < 200) return;
  cacheSet(rssContentCache, url, html);
}

// 候选正文容器（按优先级；覆盖默认 4 源 + 通用兜底）
// 注意：爱范儿 <article> 仅含导语，全文在 div#article-content，须排在通用 article 之前
const CONTENT_CANDIDATES = [
  { tag: 'div', re: /<div[^>]*\bid=["']paragraph["'][^>]*>/i },                                   // IT之家
  { tag: 'div', re: /<div[^>]*\bclass=["'][^"']*\bpost_content\b[^"']*["'][^>]*>/i },             // IT之家(旧版)
  { tag: 'div', re: /<div[^>]*\bclass=["'][^"']*\barticle-content\b[^"']*["'][^>]*>/i },          // 极客公园
  { tag: 'div', re: /<div[^>]*\bclass=["'][^"']*\barticle__main__content\b[^"']*["'][^>]*>/i },   // 少数派
  { tag: 'div', re: /<div[^>]*\bid=["'](?:article-content|article_content)["'][^>]*>/i },         // 爱范儿
  { tag: 'article', re: /<article\b[^>]*>/i },                                                    // 通用
  { tag: 'div', re: /<div[^>]*\bid=["']content["'][^>]*>/i },
  { tag: 'div', re: /<div[^>]*\bclass=["'][^"']*\b(?:entry-content|main-content|article_text|article-body)\b[^"']*["'][^>]*>/i }
];

// 清洗后允许保留的标签
const KEEP_TAGS = new Set(['p', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'blockquote',
  'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'br', 'figure',
  'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'pre', 'code']);
// 需要整体丢弃（含子内容）的容器：脚本/样式/嵌入/广告/分享/相关推荐/二维码/声明等
const DROP_TAGS = new Set(['script', 'style', 'iframe', 'noscript', 'form', 'svg', 'canvas', 'video', 'audio']);
const BAD_BLOCK_RE = /(?:^|[\s_-])(?:ad|ads|adv|advert|advertisement|banner|share|shared|sharing|promo|related|recommend|recommendation|qrcode|qr-code|wx-qrcode|statement|copyright|app-download|article-tag|post-tag|news-tag|article-tags|post-tags|article-info|article-sidebar)(?:[\s_-]|$)/i;
// 占位/装饰图（文件名命中即丢弃）
const BAD_IMG_RE = /(?:^|\/)(?:t|spacer|blank|pixel|placeholder|loading|lazy|logo|qr|qrcode|default|avatar|grey|gray)\.(?:png|gif|jpe?g|svg|webp)$/i;

// 从开标签处提取匹配的闭合元素内部 HTML（支持嵌套同标签）
function extractElementInner(html, tag, fromIdx) {
  const re = new RegExp('<(/?)' + tag + '\\b[^>]*?(/?)>', 'gi');
  re.lastIndex = fromIdx;
  let depth = 0;
  let innerStart = -1;
  let m;
  while ((m = re.exec(html))) {
    if (m[2] === '/') continue; // 自闭合
    if (m[1] === '/') {
      depth--;
      if (depth === 0) return html.slice(innerStart, m.index);
    } else {
      if (depth === 0) innerStart = m.index + m[0].length;
      depth++;
    }
  }
  return null;
}

// 候选容器全部尝试，取有效正文最长者（避免误中小容器，如爱范儿仅含导语的 <article>）
function findContentInner(html) {
  let best = null;
  let bestLen = 0;
  for (const c of CONTENT_CANDIDATES) {
    // 每个候选可能命中多处（如多个 article），逐一比较
    const re = new RegExp(c.re.source, c.re.flags.indexOf('g') === -1 ? c.re.flags + 'g' : c.re.flags);
    let m;
    while ((m = re.exec(html))) {
      const inner = extractElementInner(html, c.tag, m.index);
      if (!inner) continue;
      const len = plainText(inner).length;
      if (len > bestLen) { bestLen = len; best = inner; }
      if (bestLen > 2000) break; // 已足够长，不必再找
    }
    if (bestLen > 2000) break;
  }
  return bestLen >= 60 ? best : null;
}

function decodeEntities(s) {
  return (s || '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
}

function resolveUrl(u, base) {
  if (!u) return '';
  try { return new URL(u, base).href; } catch (e) { return ''; }
}

// srcset 取最大图（最后一个候选）
function pickFromSrcset(srcset) {
  if (!srcset) return '';
  const parts = srcset.split(',');
  for (let i = parts.length - 1; i >= 0; i--) {
    const url = parts[i].trim().split(/\s+/)[0];
    if (url) return url;
  }
  return '';
}

// 解析标签属性为小写键对象
function parseAttrs(raw) {
  const bag = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m;
  while ((m = re.exec(raw || ''))) {
    bag[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
  }
  return bag;
}

function escapeAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// img 真实地址：src(非占位) > data-original/data-src/data-actualsrc > srcset
function pickImgSrc(bag) {
  const cands = [bag.src, bag['data-original'], bag['data-src'],
    bag['data-actualsrc'], bag['data-lazy-src'], bag['data-original-src'],
    pickFromSrcset(bag.srcset), pickFromSrcset(bag['data-srcset'])];
  for (const c of cands) {
    if (c && !BAD_IMG_RE.test(c.split('?')[0])) return c;
  }
  return '';
}

// 白名单清洗：保留安全标签与文本，其余脱标保留子内容；坏容器整体丢弃
function sanitizeHtml(html, baseUrl) {
  let out = '';
  const stack = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g;
  let last = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m.index > last) out += html.slice(last, m.index);
    last = re.lastIndex;
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    const attrsRaw = m[3] || '';

    // 整体丢弃的标签：跳到对应闭合标签之后
    if (DROP_TAGS.has(name)) {
      if (!closing) {
        const lower = html.toLowerCase();
        const closeIdx = lower.indexOf('</' + name, re.lastIndex);
        if (closeIdx === -1) { last = html.length; break; }
        last = html.indexOf('>', closeIdx) + 1;
        re.lastIndex = last;
      }
      continue;
    }

    const bag = parseAttrs(attrsRaw);
    const cls = (bag.class || '') + ' ' + (bag.id || '');
    // 广告/分享/相关推荐/二维码等容器：整体丢弃
    if (!closing && BAD_BLOCK_RE.test(cls)) {
      const lower = html.toLowerCase();
      const closeIdx = lower.indexOf('</' + name, re.lastIndex);
      if (closeIdx === -1) { last = html.length; break; }
      last = html.indexOf('>', closeIdx) + 1;
      re.lastIndex = last;
      continue;
    }

    if (!KEEP_TAGS.has(name)) continue; // 未列出的标签：去掉标签、保留子内容

    if (closing) {
      if (stack.indexOf(name) === -1) continue;
      while (stack.length) {
        const t = stack.pop();
        out += '</' + t + '>';
        if (t === name) break;
      }
      continue;
    }

    if (name === 'img') {
      if (BAD_IMG_RE.test(cls)) continue; // logo/二维码等装饰图
      const src = resolveUrl(pickImgSrc(bag), baseUrl);
      if (!src) continue;
      out += '<img src="' + escapeAttr(src) + '" alt="' + escapeAttr(bag.alt || '') +
        '" loading="lazy" referrerpolicy="no-referrer" ' +
        "onerror=\"this.style.visibility='hidden'\">";
      continue;
    }
    if (name === 'br' || name === 'hr') { out += '<' + name + '>'; continue; }
    if (name === 'a') {
      const href = resolveUrl(bag.href, baseUrl);
      if (!href || /^javascript:/i.test(href)) continue; // 无有效链接则脱标保留文字
      out += '<a href="' + escapeAttr(href) + '" target="_blank" rel="noopener">';
      stack.push(name);
      continue;
    }
    out += '<' + name + '>';
    stack.push(name);
  }
  if (last < html.length) out += html.slice(last);
  while (stack.length) out += '</' + stack.pop() + '>';
  return out;
}

function plainText(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, '');
}

async function fetchArticleHtml(url) {
  // 缓存命中
  const hit = cacheGet(articleCache, url);
  if (hit) return hit;

  const page = await getCurl(url, {
    referer: new URL(url).origin + '/',
    headers: { 'User-Agent': BROWSER_UA, 'Accept': 'text/html,application/xhtml+xml' }
  });
  const inner = findContentInner(page || '');
  if (!inner) return null;

  const html = sanitizeHtml(inner, url);
  if (plainText(html).length < 60) return null; // 正文太少：会员墙/JS 渲染/解析失败

  cacheSet(articleCache, url, html);
  return html;
}

// 冷缓存补救：重新拉取所有 feed，按 URL 路径匹配找这篇的全文
async function lookupFromFeeds(url) {
  const feeds = (config.NEWS_RSS_FEEDS && config.NEWS_RSS_FEEDS.length)
    ? config.NEWS_RSS_FEEDS : DEFAULT_FEEDS;
  let targetPath = '';
  try { targetPath = new URL(url).pathname; } catch (e) { return null; }
  const results = await Promise.all(feeds.map(fetchFeed));
  for (const items of results) {
    for (const it of items) {
      let same = it.m_url === url;
      if (!same) {
        try { same = new URL(it.m_url).pathname === targetPath; } catch (e) { /* ignore */ }
      }
      if (same) {
        cacheRssContent(it.m_url, it.m_content);
        const cached = cacheGet(rssContentCache, it.m_url);
        if (cached) return cached;
      }
    }
  }
  return null;
}

// 原文正文接口：成功 {ok:true, html}；失败 {ok:false, reason}（前端回退摘要+阅读原文）
async function getNewsContent(req, res, query) {
  const url = query.url || '';
  if (!url) return sendJSON(res, { ok: false, reason: 'missing url' });
  try {
    // 1. feed 全文缓存（列表加载时预热）
    let html = cacheGet(rssContentCache, url);
    // 2. 冷缓存（直接打开详情页）：补拉 feed
    if (!html) html = await lookupFromFeeds(url);
    // 3. 页面抓取（feed 仅摘要的源，如少数派）
    if (!html) html = await fetchArticleHtml(url);
    if (html) return sendJSON(res, { ok: true, html: html });
    return sendJSON(res, { ok: false, reason: 'extract failed' });
  } catch (e) {
    console.warn('[news] 原文获取失败 ' + url + ': ' + (e && e.message));
    return sendJSON(res, { ok: false, reason: e && e.message });
  }
}

module.exports = { getNewsList, getNewsContent };
