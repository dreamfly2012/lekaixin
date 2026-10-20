'use strict';

/**
 * 等价 getimage.php：图片代理。
 *   - 本地资源（/img/...、/audio/... 等根相对路径）：直接读取并返回（离线可用）。
 *   - 远端图片（http(s)://...）：抓取并代理，自动按域名设置 Referer 绕过防盗链
 *     （IT之家 / 极客公园 等站点对直链访问返回 403，必须带来源站 Referer）。
 * 远端代理默认开启；上游不可达时返回 404，前端会降级为占位图。
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getCurlBuffer } = require('../http');
const { sendBuffer } = require('../reply');

const ROOT = path.join(__dirname, '..', '..');
const MIME = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp'
};

// 防盗链站点的 Referer 白名单：host 前缀 -> Referer
const REFERER_RULES = [
  [/img\.ithome\.com$/i, 'https://www.ithome.com/'],
  [/ithome\.com$/i, 'https://www.ithome.com/'],
  [/imgslim\.geekpark\.net$/i, 'https://www.geekpark.net/'],
  [/geekpark\.net$/i, 'https://www.geekpark.net/'],
  [/s3\.ifanr\.com$/i, 'https://www.ifanr.com/'],
  [/ifanr\.com$/i, 'https://www.ifanr.com/'],
  [/sspai\.com$/i, 'https://sspai.com/'],
  [/cdn\.sspai\.com$/i, 'https://sspai.com/']
];

function pickReferer(url) {
  try {
    const host = new URL(url).host;
    for (const [re, ref] of REFERER_RULES) {
      if (re.test(host)) return ref;
    }
    // 未知站点：退回到同源目录 Referer，多数站点只校验「Referer 存在」
    return new URL(url).origin + '/';
  } catch (e) {
    return '';
  }
}

function safeJoin(root, rel) {
  const p = path.normalize(path.join(root, rel));
  if (!p.startsWith(root)) return null;
  return p;
}

async function getImage(req, res, query) {
  const target = String(query.url || '');

  // 1) 本地资源：直接读取
  if (target.startsWith('/')) {
    const filePath = safeJoin(ROOT, target);
    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      return sendBuffer(res, fs.readFileSync(filePath), MIME[ext] || 'application/octet-stream');
    }
  }

  // 2) 远端图片代理：默认开启，自动带 Referer 绕过防盗链
  if (/^https?:\/\//.test(target)) {
    try {
      const buf = await getCurlBuffer(target, {
        referer: pickReferer(target),
        headers: {
          'User-Agent': config.ua.mobile,
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
        }
      });
      // 按 URL 后缀推断 MIME，避免原实现一律 jpeg 的问题
      let mime = 'image/jpeg';
      try {
        const ext = path.extname(new URL(target).pathname).toLowerCase();
        if (MIME[ext]) mime = MIME[ext];
      } catch (e) { /* 保持默认 */ }
      return sendBuffer(res, buf, mime);
    } catch (e) {
      console.warn('[image] 远端代理失败:', e.message);
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('图片不存在: ' + target);
}

module.exports = getImage;
