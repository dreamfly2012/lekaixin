#!/usr/bin/env node
/**
 * 组装 APK 所需的 Web 资源到 mobile/www（Capacitor webDir）
 * ------------------------------------------------------------------
 * 用法：
 *   node tools/build_mobile.js --host https://api.example.com
 *   LK_API_HOST=https://api.example.com node tools/build_mobile.js
 *
 * 说明：
 *   APK 的 WebView 里跑不了 Node 后端，必须先把 server.js 部署到公网，
 *   再把后端地址注入页面（window.LK_API_HOST）。页面里的 access_host 会
 *   优先读它，读不到才回退同源地址（浏览器开发模式不受影响）。
 *
 *   打进 APK 的只有纯前端静态资源；backend/、mock/、server.js、audio/
 *   （5.7MB 旧 demo 音乐，页面无引用）等全部排除。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'mobile', 'www');

// 需要打进 APK 的静态资源白名单
const COPY_ENTRIES = [
  'index.html',
  'icon.png',
  'logo.png',
  'sa.png',
  'sa@2x.png',
  'sa@3x.png',
  'plus',
  'css',
  'js',
  'img',
  'fonts'
];

function parseHost() {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--host' && argv[i + 1]) return argv[i + 1].replace(/\/+$/, '');
  }
  return (process.env.LK_API_HOST || '').replace(/\/+$/, '');
}

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  for (const e of fs.readdirSync(p)) {
    const full = path.join(p, e);
    if (fs.statSync(full).isDirectory()) rmrf(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(p);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src)) {
    const s = path.join(src, e);
    const d = path.join(dst, e);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// 在 <head> 后注入远程 API 地址（重复构建时先清理旧注入）
function injectApiHost(file, host) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/[ \t]*<script>window\.LK_API_HOST=[\s\S]*?<\/script>\s*\n?/g, '');
  const tag = '<script>window.LK_API_HOST=' + JSON.stringify(host) + ';</script>';
  const m = /<head[^>]*>/i.exec(html);
  if (!m) {
    console.warn('[build_mobile] 未找到 <head>，跳过注入: ' + path.basename(file));
    return;
  }
  html = html.slice(0, m.index + m[0].length) + '\n\t' + tag + html.slice(m.index + m[0].length);
  fs.writeFileSync(file, html, 'utf8');
}

function main() {
  const host = parseHost();
  if (!/^https?:\/\/[^\s]+$/.test(host)) {
    console.error('[build_mobile] 缺少合法的后端地址。APK 内无法运行 Node 后端，');
    console.error('  请先把 server.js 部署到公网服务器，然后执行：');
    console.error('    node tools/build_mobile.js --host https://api.example.com');
    process.exit(1);
  }

  rmrf(OUT);
  fs.mkdirSync(OUT, { recursive: true });

  let fileCount = 0;
  for (const e of COPY_ENTRIES) {
    const src = path.join(ROOT, e);
    if (!fs.existsSync(src)) {
      console.warn('[build_mobile] 跳过不存在的条目: ' + e);
      continue;
    }
    const dst = path.join(OUT, e);
    if (fs.statSync(src).isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }

  // 收集全部 HTML 注入 API 地址
  const htmlFiles = [];
  const rootIndex = path.join(OUT, 'index.html');
  if (fs.existsSync(rootIndex)) htmlFiles.push(rootIndex);
  const plusDir = path.join(OUT, 'plus');
  if (fs.existsSync(plusDir)) {
    for (const f of fs.readdirSync(plusDir)) {
      if (f.toLowerCase().endsWith('.html')) htmlFiles.push(path.join(plusDir, f));
    }
  }
  for (const f of htmlFiles) injectApiHost(f, host);

  for (const f of htmlFiles) fileCount++;
  console.log('[build_mobile] 已生成 ' + OUT);
  console.log('[build_mobile] 注入页面 ' + fileCount + ' 个，API 地址: ' + host + '/app_backend/');
  console.log('[build_mobile] 下一步: cd mobile && npx cap sync android');
}

main();
