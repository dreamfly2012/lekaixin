'use strict';

/**
 * 等价 rabit.php：关于页。
 * 原 PHP 是一份 RabbitPre 微场景 HTML（"致遇到麻烦的您"），但其资源全部依赖外部
 * CDN（oss.szzbmy.com）且已不可离线运行。这里改为返回本地自包含的关于页内容，
 * 路由与字段保持一致，保证离线可访问。
 */
const mock = require('../mock');
const { sendHTML } = require('../reply');

async function getAbout(req, res) {
  return sendHTML(res, mock.getAbout());
}

module.exports = getAbout;
