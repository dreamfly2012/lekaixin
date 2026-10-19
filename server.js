'use strict';

/**
 * 乐开心 (lekaixin) 本地开发服务器
 * ----------------------------------------
 * 零依赖 Node 服务，前后端一体：
 *   1. 从项目根目录静态托管 H5 页面（index.html / css / js / img / fonts / audio / plus）
 *   2. 通过 /app_backend/*.php 提供后端接口，路由表见 backend/index.js
 *      —— 每个接口逻辑由 backend/routes/*.js 实现（由原始 PHP 后端移植而来）
 *      —— 默认返回本地 mock 数据（mock/data.json），配置 USE_REMOTE=1 后真实转发远端上游
 *
 * 运行：  node server.js
 * 访问：  http://localhost:8080
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;
const API_PREFIX = '/app_backend/';
const routes = require('./backend');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.woff2': 'font/woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function safeJoin(root, relPath) {
  const p = path.normalize(path.join(root, relPath));
  if (!p.startsWith(root)) return null;
  return p;
}

/* --------------------------- 接口路由 --------------------------- */
async function handleApi(req, res, pathname, query) {
  const name = pathname.slice(API_PREFIX.length);
  const handler = routes[name];
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Unknown API: ' + pathname);
  }
  try {
    await handler(req, res, query);
  } catch (e) {
    console.error('[api] ' + name + ' 处理异常:', e && e.stack || e);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal error');
    }
  }
}

/* --------------------------- 静态托管 --------------------------- */
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = safeJoin(ROOT, rel);
  if (!filePath) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.stat(filePath, (err, stat) => {
    let finalPath = filePath;
    if (!err && stat.isDirectory()) {
      finalPath = safeJoin(ROOT, path.join(rel, 'index.html'));
    }
    if (!finalPath) { res.writeHead(403); res.end('Forbidden'); return; }
    fs.readFile(finalPath, (e, data) => {
      if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not Found'); return; }
      const ext = path.extname(finalPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

/* --------------------------- 启动 --------------------------- */
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const query = parsed.query || {};
  if (pathname.startsWith(API_PREFIX)) {
    return handleApi(req, res, pathname, query);
  }
  if (pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
  return serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log('乐开心本地服务已启动:');
  console.log('  -> http://localhost:' + PORT);
  console.log('后端接口前缀: ' + API_PREFIX + '  (路由见 backend/index.js)');
  console.log('数据模式: ' + (process.env.LK_USE_REMOTE === '1' || process.env.LK_USE_REMOTE === 'true'
    ? '真实远端上游（USE_REMOTE=1）'
    : '本地 mock 数据（离线可运行）'));
});
