'use strict';

/**
 * 路由表：把 /app_backend/<name>.php 映射到对应的 JS handler。
 * handler 签名统一为 async (req, res, query) => void
 * 每个 handler 内部：USE_REMOTE=true 时尝试真实转发，失败则回退本地 mock。
 */
module.exports = {
  'getjoke.php': require('./routes/joke'),
  // 新闻：替代停服的百度百家（多源中文 RSS 聚合），保留 getbaijia.php 别名兼容
  'getnews.php': require('./routes/news').getNewsList,
  'getnews_content.php': require('./routes/news').getNewsContent,
  'getbaijia.php': require('./routes/news').getNewsList,
  'getbaijia_content.php': require('./routes/news').getNewsContent,
  // 音乐：替代停服的豆瓣 FM（Audius / 网易云 可切换）
  'getchannels.php': require('./routes/music').getChannelsRoute,
  'getmusic.php': require('./routes/music').getMusic,
  'getlrc.php': require('./routes/music').getLrc,
  'getlrc_content.php': require('./routes/music').getLrcContent,
  'getimage.php': require('./routes/image'),
  'rabit.php': require('./routes/about'),
  'saveInfo.php': require('./routes/saveInfo'),
  'gettopic.php': require('./routes/topic').getTopic,
  'topicdetail.php': require('./routes/topic').getTopicDetail
};
