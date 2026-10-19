'use strict';

/**
 * 等价 getimage.php：图片代理。
 *   - 本地资源（/img/...、/audio/... 等根相对路径）：直接读取并返回（离线可用）。
 *   - 远端图片（http(s)://...）：仅当 USE_REMOTE=true 时抓取并代理（原 PHP 用 Referer 绕过防盗链）。
 * 原 PHP 固定输出 image/jpeg；本地资源则按扩展名给出正确 MIME。
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

  // 2) 远端图片代理（默认关闭）
  if (config.USE_REMOTE && /^https?:\/\//.test(target)) {
    try {
      const buf = await getCurlBuffer(target, { referer: path.dirname(target) + '/' });
      return sendBuffer(res, buf, 'image/jpeg'); // 与原 PHP 一致
    } catch (e) {
      console.warn('[image] 远端代理失败:', e.message);
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('图片不存在: ' + target);
}

module.exports = getImage;
