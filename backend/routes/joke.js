'use strict';

/**
 * 等价 getjoke.php：笑话列表接口。
 * ------------------------------------------------------------------
 * 数据源由 config.USE_JOKE 决定（默认 suyanw，免 key 中文段子，与电台/新闻一样
 * 开箱即用，无需配置密钥、不受 USE_REMOTE 限制）：
 *   suyanw  素颜API 随机段子（api.suyanw.cn/api/duanzi.php），免 key、中文，
 *           单次返回一条，服务端按 JOKE_SIZE 并发多次调用组装列表并去重
 *   showapi ShowAPI 笑话大全（route.showapi.com/341-2），中文，需有效密钥
 *   jokeapi JokeAPI v2（v2.jokeapi.dev），免 key、英文 safe-mode，兜底源
 *
 * 远端失败按「首选源 -> 其余远端源 -> 本地 mock」逐层回退，保证始终有数据。
 *
 * 真实段子接口只有文字、无标题无配图：
 *   - title 由正文首句派生；
 *   - img   轮换使用本地卡通插图（/img/jokes/jk01-10.svg），与 mock 数据视觉一致。
 * 输出契约不变：[{title, img, text}]，前端零改动。
 */
const crypto = require('crypto');
const config = require('../config');
const mock = require('../mock');
const { getCurl } = require('../http');
const { sendJSON } = require('../reply');

// 本地卡通插图（真实段子接口无配图，轮换使用，保持列表视觉一致）
const LOCAL_JOKE_IMGS = Array.from(
  { length: 10 },
  (_, i) => '/img/jokes/jk' + String(i + 1).padStart(2, '0') + '.svg'
);
let imgCursor = 0;
function nextImg() {
  const url = LOCAL_JOKE_IMGS[imgCursor % LOCAL_JOKE_IMGS.length];
  imgCursor++;
  return url;
}

// 从正文派生短标题（首句，最多 14 字）
function deriveTitle(text) {
  const t = (text || '').trim();
  if (!t) return '每日段子';
  const m = t.match(/^[^。！？!?；;\n]{1,14}/);
  const title = (m ? m[0] : t.slice(0, 14)).trim();
  return title || '每日段子';
}

// 纯文本 -> 列表项；空内容/HTML 错误页返回 null
function toItem(rawText) {
  const text = String(rawText || '').replace(/\r/g, '').trim();
  if (!text || text.charAt(0) === '<') return null;
  return { title: deriveTitle(text), img: nextImg(), text: text };
}

function normalizeCount(count) {
  const n = Number(count);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 20) : config.JOKE_SIZE;
}

/* ----------------------- 素颜API：随机段子（免 key） ----------------------- */
async function fetchSuyanw(count) {
  const n = normalizeCount(count);
  // 单次一条，并发 n 次；allSettled 保留部分成功的结果
  const results = await Promise.allSettled(
    Array.from({ length: n }, () => getCurl('https://api.suyanw.cn/api/duanzi.php'))
  );
  const items = [];
  const seen = new Set();
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    const item = toItem(r.value);
    if (!item || seen.has(item.text)) continue;
    seen.add(item.text);
    items.push(item);
  }
  return items;
}

/* ----------------------- ShowAPI 笑话大全（需密钥） ----------------------- */
// 等价 PHP createParam()：ksort + md5 签名
function createParam(paramArr, secret) {
  const keys = Object.keys(paramArr).sort();
  let signStr = '';
  let paraStr = '';
  for (const k of keys) {
    const v = paramArr[k];
    if (k !== '' && v !== '') {
      signStr += k + v;
      paraStr += k + '=' + encodeURIComponent(v) + '&';
    }
  }
  signStr += secret;
  const sign = crypto.createHash('md5').update(signStr).digest('hex').toLowerCase();
  paraStr += 'showapi_sign=' + sign;
  return paraStr;
}

async function fetchShowapi(count) {
  // 未配置密钥（环境变量）时直接跳过，避免无谓请求
  if (!config.showapi.appid || !config.showapi.secret) return [];
  const paramArr = {
    showapi_appid: config.showapi.appid,
    page: '1',
    maxResult: String(normalizeCount(count))
  };
  const param = createParam(paramArr, config.showapi.secret);
  const url = 'http://route.showapi.com/341-2?' + param;
  const info = JSON.parse(await getCurl(url, {}));
  // 密钥无效时返回 {ret_code:-1, remark:"暂无数据"}，按空数据处理触发回退
  if (!info || !info.showapi_res_body || !Array.isArray(info.showapi_res_body.contentlist)) return [];
  return info.showapi_res_body.contentlist
    .map(it => {
      const text = String((it && it.text) || '').trim();
      if (!text) return null;
      return {
        title: String((it && it.title) || '').trim() || deriveTitle(text),
        img: nextImg(),
        text: text
      };
    })
    .filter(Boolean);
}

/* ----------------------- JokeAPI v2（免 key，英文兜底） ----------------------- */
async function fetchJokeapi(count) {
  const n = normalizeCount(count);
  const url = 'https://v2.jokeapi.dev/joke/Any?safe-mode&type=single&amount=' + n + '&lang=en';
  const info = JSON.parse(await getCurl(url));
  if (!info || info.error) return [];
  const jokes = Array.isArray(info.jokes) ? info.jokes : [info];
  return jokes
    .map(j => toItem(j && (j.joke || ((j.setup || '') + '\n' + (j.delivery || '')))))
    .filter(Boolean);
}

/* ----------------------------- 路由入口 ----------------------------- */
const REMOTE_SOURCES = {
  suyanw: fetchSuyanw,
  showapi: fetchShowapi,
  jokeapi: fetchJokeapi
};

async function getJoke(req, res, query) {
  const count = query.p ? normalizeCount(query.p) : config.JOKE_SIZE;
  // 尝试顺序：首选源 -> 其余远端源（任一向失败即下一个）
  const primary = config.USE_JOKE;
  const order = [primary].concat(Object.keys(REMOTE_SOURCES).filter(k => k !== primary));
  for (const name of order) {
    const fn = REMOTE_SOURCES[name];
    if (!fn) continue;
    try {
      const items = await fn(count);
      if (items.length) {
        console.log('[joke] 数据源 ' + name + '，返回 ' + items.length + ' 条');
        return sendJSON(res, items);
      }
      console.warn('[joke] 源 ' + name + ' 无有效数据，尝试下一个源');
    } catch (e) {
      console.warn('[joke] 源 ' + name + ' 失败: ' + (e && e.message));
    }
  }
  // 远端全部不可用 -> 本地 mock
  return sendJSON(res, mock.getJokes());
}

module.exports = getJoke;
