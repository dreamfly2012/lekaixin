'use strict';

/**
 * 后端配置（等价原 PHP 中的密钥 / cookie 常量）
 * ------------------------------------------------------------------
 * USE_REMOTE = false（默认）：需要密钥的上游（如 ShowAPI）直接走回退，不发起调用。
 * USE_REMOTE = true        ：真实转发到原上游接口（需配置下方有效密钥，
 *                             且上游服务仍然可用。注意：豆瓣FM/百度百家等
 *                             上游多数已停服，即便开启也可能失败并回退 mock）。
 *
 * 注：音乐（Audius/网易云）、新闻（多源 RSS）、笑话（素颜段子）等开源免 key 数据源
 * 不受 USE_REMOTE 控制，始终优先尝试远端，失败自动回退本地 mock。
 *
 * 开启方式（任选其一）：
 *   - 环境变量：  set LK_USE_REMOTE=1  （Linux/Mac: export LK_USE_REMOTE=1）
 *   - 或直接在下方把 USE_REMOTE 改为 true
 *
 * 安全约定：本项目开源发布，**任何密钥/cookie 都不硬编码在代码里**，
 * 一律通过环境变量注入（见下方 process.env.*），仓库中不出现真实凭据。
 */

module.exports = {
  // 是否启用真实远端后端（默认关闭，使用本地 mock 保证可运行）
  USE_REMOTE: process.env.LK_USE_REMOTE === '1' || process.env.LK_USE_REMOTE === 'true',

  // ===== 音乐数据源（替代已停服的豆瓣 FM）=====
  //   'audius'  （默认）开源去中心化音乐，免 key、可直接流式播放，内容以欧美独立音乐为主
  //   'netease' 网易云音乐开源 API（NeteaseCloudMusicApi），中文歌曲可真实播放，
  //             需自行部署该服务或将 LK_NCM_API 指向公共/私有地址
  USE_MUSIC: process.env.LK_USE_MUSIC || 'audius',

  // 网易云音乐 API 基地址（仅 USE_MUSIC=netease 时生效）
  NCM_API: process.env.LK_NCM_API || 'http://localhost:3000',

  // Audius 应用标识（必填，任取字符串即可，用于流量归属）
  AUDIUS_APP: process.env.LK_AUDIUS_APP || 'lekaixin',

  // ===== 新闻数据源（替代已停服的百度百家）=====
  // 采用「多源中文 RSS 聚合」（开源、免 key）：爱范儿 / 极客公园 / IT之家 / 少数派。
  // 如需自定义源，用环境变量传 JSON： set LK_NEWS_FEEDS=[{"url":"...","source":"..."}]
  NEWS_RSS_FEEDS: (() => {
    if (process.env.LK_NEWS_FEEDS) {
      try { return JSON.parse(process.env.LK_NEWS_FEEDS); } catch (e) { /* 忽略，走默认 */ }
    }
    return [
      { url: 'https://www.ifanr.com/feed', source: '爱范儿' },
      { url: 'https://www.geekpark.net/rss', source: '极客公园' },
      { url: 'https://www.ithome.com/rss/', source: 'IT之家' },
      { url: 'https://sspai.com/feed', source: '少数派' }
    ];
  })(),
  NEWS_SIZE: Number(process.env.LK_NEWS_SIZE) || 30,

  // 请求超时（毫秒）
  TIMEOUT: Number(process.env.LK_TIMEOUT) || 8000,

  // ===== 笑话数据源（默认免 key 中文段子，无需 USE_REMOTE）=====
  //   'suyanw'  （默认）素颜API 随机段子，免 key、中文；单次返回一条，
  //             服务端按 JOKE_SIZE 并发多次调用组装列表
  //   'showapi' ShowAPI 笑话大全（route.showapi.com/341-2），中文，
  //             需自行注册替换下方 appid/secret（注册即有免费额度）
  //   'jokeapi' JokeAPI v2（v2.jokeapi.dev，免 key、英文 safe-mode），兜底源
  // 远端失败按 首选源 -> 其余源 -> 本地 mock 逐层回退。
  USE_JOKE: process.env.LK_USE_JOKE || 'suyanw',

  // 笑话列表每次返回条数
  JOKE_SIZE: Number(process.env.LK_JOKE_SIZE) || 10,

  // ShowAPI 笑话接口（route.showapi.com/341-2），仅 USE_JOKE=showapi 时生效。
  // 需自行注册（https://www.showapi.com/ ，接口 341-2，有免费额度），
  // 通过环境变量注入：LK_SHOWAPI_APPID / LK_SHOWAPI_SECRET；不配置则自动跳过该源。
  showapi: {
    appid: process.env.LK_SHOWAPI_APPID || '',
    secret: process.env.LK_SHOWAPI_SECRET || ''
  },

  // 百度百家列表 / 详情（原 apikey，上游已停服，仅作结构保留；环境变量注入）
  baiduApiKey: process.env.LK_BAIDU_APIKEY || '',

  // geci.me 歌词接口 apikey（已失效，仅作结构保留；环境变量注入）
  geciApiKey: process.env.LK_GECI_APIKEY || '',

  // 远端代理演示用的 cookie（已过期；环境变量注入，代码中不留存）
  cookie: process.env.LK_COOKIE || '',

  // User-Agent（移动/桌面），等价 common.php 的伪造
  ua: {
    mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
    desktop: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/20.0.1132.57 Safari/536.11'
  },

  // 原始 common.php 里伪造的客户端 IP 头
  spoofIp: {
    'CLIENT-IP': '101.68.44.61',
    'X-FORWARDED-FOR': '101.68.44.61'
  }
};
