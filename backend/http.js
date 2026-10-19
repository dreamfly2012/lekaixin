'use strict';

/**
 * 等价原 common.php 的 get_curl()：带伪造 IP 头、Cookie、Referer、UA 发起请求。
 * 返回文本用 getCurl()，返回二进制用 getCurlBuffer()（图片代理用）。
 */
const config = require('./config');

async function rawFetch(targetUrl, opts, asBuffer) {
  const {
    is_post = false,
    postData = '',
    referer = '',
    cookie = '',
    is_mobile = false,
    headers = {}
  } = opts || {};

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.TIMEOUT);

  const reqHeaders = Object.assign(
    {
      'User-Agent': is_mobile ? config.ua.mobile : config.ua.desktop,
      'Referer': referer,
      'Cookie': cookie
    },
    config.spoofIp,
    headers
  );

  try {
    const resp = await fetch(targetUrl, {
      method: is_post ? 'POST' : 'GET',
      headers: reqHeaders,
      body: is_post ? postData : undefined,
      redirect: 'follow',
      signal: controller.signal
    });
    if (asBuffer) {
      const ab = await resp.arrayBuffer();
      return Buffer.from(ab);
    }
    return await resp.text();
  } finally {
    clearTimeout(timer);
  }
}

function getCurl(url, opts) {
  return rawFetch(url, opts, false);
}

function getCurlBuffer(url, opts) {
  return rawFetch(url, opts, true);
}

module.exports = { getCurl, getCurlBuffer };
