'use strict';

/**
 * 统一响应辅助函数（等价 PHP 里各接口 echo 的不同 Content-Type）
 */
function sendJSON(res, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

function sendHTML(res, html) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(html);
}

function sendText(res, text, type) {
  res.writeHead(200, {
    'Content-Type': (type || 'text/plain') + '; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(text);
}

function sendBuffer(res, buf, contentType) {
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(buf);
}

module.exports = { sendJSON, sendHTML, sendText, sendBuffer };
