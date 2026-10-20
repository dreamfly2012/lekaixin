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
const STARTED_AT = new Date();

// 部署自检端点用的关键文件（改动后重启即反映真实 mtime，用来确认线上是否换了文件）
const VERSION_FILES = [
  'server.js',
  'index.html',
  'css/pages.css',
  'css/theme.css',
  'css/music.css',
  'js/AudioPlayer.js',
  'plus/news_detail.html',
  'plus/joke_detail.html',
  'plus/music.html'
];

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
/*
 * 缓存策略：no-cache + ETag/Last-Modified
 * 之前只发 Content-Type，没有校验器也没有缓存指令 —— 浏览器/Cloudflare 会按自己的
 * 启发式规则缓存 css/js，改完文件刷新还是旧样式（"上传了没变化" 的常见原因之一）。
 * 现在每次都回源校验，没改动走 304（几十字节），改动立即生效。
 */
function sendFile(req, res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not Found');
    }
    const etag = 'W/"' + stat.size.toString(16) + '-' + Math.floor(stat.mtimeMs).toString(16) + '"';
    const headers = {
      ETag: etag,
      'Last-Modified': new Date(stat.mtimeMs).toUTCString(),
      'Cache-Control': 'no-cache'
    };

    const inm = req.headers['if-none-match'];
    const ims = req.headers['if-modified-since'];
    let notModified = false;
    if (inm) {
      notModified = inm.split(',').some((t) => t.trim() === etag);
    } else if (ims) {
      const t = Date.parse(ims);
      notModified = !isNaN(t) && Math.floor(stat.mtimeMs / 1000) * 1000 <= t;
    }
    if (notModified) {
      res.writeHead(304, headers);
      return res.end();
    }

    fs.readFile(filePath, (e, data) => {
      if (e) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Not Found');
      }
      const ext = path.extname(filePath).toLowerCase();
      headers['Content-Type'] = MIME[ext] || 'application/octet-stream';
      headers['Content-Length'] = data.length;
      res.writeHead(200, headers);
      res.end(data);
    });
  });
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  let filePath = safeJoin(ROOT, rel);
  if (!filePath) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      filePath = safeJoin(ROOT, path.join(rel, 'index.html'));
      if (!filePath) { res.writeHead(403); res.end('Forbidden'); return; }
    }
    sendFile(req, res, filePath);
  });
}

/* --------------------------- 部署自检 --------------------------- */
/*
 * GET /__lk_version —— 确认「线上跑的到底是哪份代码、从哪个目录起的」
 * 排查「上传了新包但页面没变化」时先看这个：
 *   root / cwd 不对  -> 进程跑的是别的目录（最坑：解压多了一层 dist/server）
 *   startedAt 是旧的 -> 进程压根没重启（或 PM2 里另有旧进程占着 8080）
 *   assets[].mtime 是旧的 -> 文件没覆盖成功
 */
function handleVersion(res) {
  const assets = {};
  for (const rel of VERSION_FILES) {
    try {
      const st = fs.statSync(path.join(ROOT, rel));
      assets[rel] = { mtime: st.mtime.toISOString(), size: st.size };
    } catch (e) {
      assets[rel] = null; // 文件缺失，也是重要信息
    }
  }
  const body = JSON.stringify({
    pid: process.pid,
    node: process.version,
    startedAt: STARTED_AT.toISOString(),
    uptimeSec: Math.round(process.uptime()),
    cwd: process.cwd(),
    root: ROOT,
    assets: assets
  }, null, 2);
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
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
  if (pathname === '/__lk_version') { return handleVersion(res); }
  return serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log('乐开心本地服务已启动:');
  console.log('  -> http://localhost:' + PORT);
  console.log('  -> http://localhost:' + PORT + '/__lk_version  （部署自检：目录/启动时间/文件时间）');
  console.log('后端接口前缀: ' + API_PREFIX + '  (路由见 backend/index.js)');
  console.log('数据模式: ' + (process.env.LK_USE_REMOTE === '1' || process.env.LK_USE_REMOTE === 'true'
    ? '真实远端上游（USE_REMOTE=1）'
    : '本地 mock 数据（离线可运行）'));
});
