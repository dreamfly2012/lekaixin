#!/usr/bin/env node
'use strict';

/**
 * 打包「服务器部署包」（宝塔等 Node 环境直接用）
 * ------------------------------------------------------------------
 * server.js 是入口，但运行时依赖：
 *   backend/       全部路由（index.js -> routes/*.js -> config/http/mock/reply）
 *   mock/data.json mock.js 按 __dirname/../mock/data.json 读取，远端失败时的回退数据
 *   前端静态资源    server.js 同时是静态服务器，从项目根托管（页面/样式/脚本/图片/字体）
 *
 * 本脚本按白名单复制上述文件到 dist/server/，排除：
 *   mobile/（APK 工程）、tools/（构建脚本）、unpackage/、.github/、.workbuddy/、
 *   audio/（5.7MB 旧 demo 音乐，零引用）、*.md
 *
 * 用法：
 *   node tools/pack_server.js                  # 输出到 dist/server/
 *   node tools/pack_server.js --tar            # 额外生成 dist/lekaixin-server.tar.gz
 *
 * 服务器上（宝塔 Node 项目）：
 *   mkdir -p /www/wwwroot/lekaixin
 *   tar -xzf lekaixin-server.tar.gz -C /www/wwwroot/lekaixin
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist', 'server');

// 运行时必需文件/目录（白名单，缺一不可）
const WHITELIST = [
  'server.js',
  'backend',                 // 路由 + config/http/mock/reply + data/users.json
  'mock',                    // data.json（回退数据源）
  'index.html',
  'css',
  'js',
  'img',
  'fonts',
  'plus',                    // 详情子页面（新闻全文/音乐台等）
  'manifest.json',
  'icon.png',
  'logo.png',
  'sa.png',
  'sa@2x.png',
  'sa@3x.png'
];

// 白名单目录内要排除的运行时数据（本地测试产生的用户数据，不打包、不入库）
const EXCLUDE = ['backend/data/users.json'];

function copyDir(src, dest) {
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    const rel = path.relative(ROOT, s).split(path.sep).join('/');
    if (EXCLUDE.includes(rel)) continue;
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.mkdirSync(path.dirname(d), { recursive: true }); // 惰性建目录，避免空目录残留
      fs.copyFileSync(s, d);
    }
  }
}

function main() {
  // 清掉旧产物，保证幂等
  fs.rmSync(OUT_DIR, { recursive: true, force: true });

  let files = 0;
  let bytes = 0;
  for (const item of WHITELIST) {
    const src = path.join(ROOT, item);
    if (!fs.existsSync(src)) {
      console.warn('[warn] 白名单条目不存在，已跳过: ' + item);
      continue;
    }
    const dest = path.join(OUT_DIR, item);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      const before = { files: 0, bytes: 0 };
      copyDir(src, dest);
      // 统计目录内文件
      const walk = (dir) => {
        for (const name of fs.readdirSync(dir)) {
          const p = path.join(dir, name);
          if (fs.statSync(p).isDirectory()) walk(p);
          else { before.files++; before.bytes += fs.statSync(p).size; }
        }
      };
      walk(dest);
      files += before.files;
      bytes += before.bytes;
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      files++;
      bytes += stat.size;
    }
  }

  console.log('部署包已生成: ' + OUT_DIR);
  console.log('  文件数: ' + files + ' | 大小: ' + (bytes / 1024 / 1024).toFixed(2) + ' MB');
  console.log('');
  console.log('上传到服务器后（宝塔 Node 项目目录）:');
  console.log('  mkdir -p /www/wwwroot/lekaixin');
  console.log('  # 把 dist/server/ 内容整体上传/解压到该目录');
  console.log('  # 启动命令: node server.js   端口: 8080');
}

main();
