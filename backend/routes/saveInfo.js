'use strict';

/**
 * 等价 saveInfo.php：用户注册/留言信息入库。
 * 原 PHP 用 MySQL（lekaixin.user 表）。为保持「单一 JS 项目、零外部依赖、开箱即跑」，
 * 这里改为写入本地 JSON 文件（backend/data/users.json），行为等价（含密码 md5）。
 * 若要实现真正的持久化，可后续替换为 SQLite / 真实数据库。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sendJSON } = require('../reply');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USER_FILE = path.join(DATA_DIR, 'users.json');

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USER_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function writeUsers(arr) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USER_FILE, JSON.stringify(arr, null, 2));
}

// 读取请求体（POST 为 JSON，GET 直接用 query）
async function parseBody(req, query) {
  if (req.method === 'POST') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    } catch (e) {
      return {};
    }
  }
  return query;
}

async function saveInfo(req, res, query) {
  const params = await parseBody(req, query);
  const telephone = params.telephone || '';
  const desc = params.desc || '';
  const img = params.img || '';
  const password = params.password || '';
  const encrypt_password = password ? crypto.createHash('md5').update(password).digest('hex') : '';

  const users = readUsers();
  users.push({
    telephone,
    desc,
    img,
    encrypt_password,
    created_at: new Date().toISOString()
  });
  writeUsers(users);

  return sendJSON(res, { ok: true, count: users.length });
}

module.exports = saveInfo;
