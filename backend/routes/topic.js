'use strict';

/**
 * 等价 gettopic.php（QQ 部落帖子列表）与 topicdetail.php（帖子详情）。
 * 这两个接口原前端并未使用，这里仅做结构还原 + mock 兜底，便于后续扩展。
 */
const config = require('../config');
const mock = require('../mock');
const { getCurl } = require('../http');
const { sendJSON, sendText } = require('../reply');

async function getTopic(req, res) {
  if (config.USE_REMOTE) {
    try {
      const url = 'http://buluo.qq.com/cgi-bin/bar/post/get_post_by_page?bid=10640&num=20' +
        '&start=20&source=2&r=0.995774316438155&bkn=1881560083';
      const text = await getCurl(url, {
        cookie: config.cookie,
        referer: 'http://buluo.qq.com/p/barindex.html?bid=10640'
      });
      return sendText(res, text, 'application/json');
    } catch (e) {
      console.warn('[topic] 远端失败，回退本地:', e.message);
    }
  }
  return sendJSON(res, mock.getTopic());
}

async function getTopicDetail(req, res, query) {
  const tid = query.tid || '4664101-1463272363';
  if (config.USE_REMOTE) {
    try {
      const url = 'http://buluo.qq.com/cgi-bin/bar/post/content?bid=10437&pid=' + tid;
      const text = await getCurl(url, {
        cookie: config.cookie,
        referer: 'http://buluo.qq.com/p/barindex.html?bid=10437'
      });
      return sendText(res, text, 'application/json');
    } catch (e) {
      console.warn('[topicdetail] 远端失败，回退本地:', e.message);
    }
  }
  return sendJSON(res, mock.getTopicDetail(tid));
}

module.exports = { getTopic, getTopicDetail };
