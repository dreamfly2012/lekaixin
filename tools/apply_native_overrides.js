#!/usr/bin/env node
/**
 * 把 mobile/native/ 下的原生覆盖文件复制进 Capacitor 生成的 android 工程。
 *
 * 为什么需要这一步：mobile/android/ 是 cap add 生成物且已被 gitignore，
 * CI 每次构建都会重新 `npx cap add android`，直接修改生成物会丢失。
 * 所以原生改动统一放在 mobile/native/，每次生成工程后跑本脚本覆盖过去。
 *
 * 约定：按 .java 文件里的 `package xxx.yyy;` 自动映射到
 *       android/app/src/main/java/xxx/yyy/ 目录。
 *
 * 用法（仓库根目录）：
 *   node tools/apply_native_overrides.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'mobile', 'native');
const javaRoot = path.join(root, 'mobile', 'android', 'app', 'src', 'main', 'java');

function fail(msg) {
  console.error('[native] ' + msg);
  process.exit(1);
}

if (!fs.existsSync(srcDir)) {
  console.log('[native] 没有 mobile/native/ 覆盖目录，跳过');
  process.exit(0);
}
if (!fs.existsSync(javaRoot)) {
  fail('未找到 Android 工程：' + javaRoot);
  fail('请先在 mobile/ 下执行 npm install && npx cap add android');
}

const files = fs.readdirSync(srcDir).filter(function (f) { return f.endsWith('.java'); });
if (!files.length) {
  console.log('[native] mobile/native/ 下没有 .java 文件，跳过');
  process.exit(0);
}

let copied = 0;
files.forEach(function (file) {
  const abs = path.join(srcDir, file);
  const code = fs.readFileSync(abs, 'utf8');
  const m = code.match(/^\s*package\s+([\w.]+)\s*;/m);
  if (!m) fail(file + ' 缺少 package 声明，无法确定目标目录');

  const pkgDir = path.join(javaRoot, m[1].replace(/\./g, path.sep));
  fs.mkdirSync(pkgDir, { recursive: true });
  const dest = path.join(pkgDir, file);
  fs.writeFileSync(dest, code, 'utf8');
  console.log('[native] ' + file + ' -> ' + path.relative(root, dest).replace(/\\/g, '/'));
  copied++;
});

console.log('[native] 覆盖完成，共 ' + copied + ' 个文件');
