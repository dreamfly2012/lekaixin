### 乐开心 (lekaixin)

基于 DCloud MUI 开发的音乐笑话 App（HBuilder 移动 Web 应用）。

原项目依赖的远程后端 `http://www.80shihua.com/app_backend/` 已失效，导致 App 打开无内容、子页面无法加载。本仓库已重构为 **可在本地浏览器直接运行**：

- 新增 `server.js`：零依赖 Node 服务，**前后端一体**——既托管静态页面，又通过 `/app_backend/*.php` 提供后端接口（路由见 `backend/index.js`）。
- **后端已由 PHP 移植为 JS**：原 `app_backend/*.php`（笑话/百家/音乐/歌词/图片代理/关于页/注册）的全部逻辑已 1:1 转为 `backend/routes/*.js`，不再依赖 PHP 运行环境。**电台（Audius）、新闻（多源 RSS）、笑话（素颜段子）均默认走开源免 key 真实接口**，全部失败才回退本地 mock；仅剩需密钥的上游（如 ShowAPI）受 `USE_REMOTE` 控制（详见下方「数据源切换」）。
- **真实模拟数据**：`mock/data.json` 由 `tools/gen_assets.py` 生成，包含 15 首本地合成可播放旋律（WAV）、每首歌真实封面、6 篇带配图的资讯文章（标题/摘要/正文图文，作为新闻接口离线回退）、10 条带配图的笑话。歌曲可播放、可上一首/下一首/点歌单切换，且每首有各自歌词。
- 页面 `access_host` 改为同源本地接口（支持 `window.LK_API_HOST` 覆盖，APK 打包时注入远程后端地址）；素材 URL 统一使用根绝对路径（带前导 `/`），子页面兼容浏览器（URL query 传参）与原生 5+ 真机环境。
- 修复首屏笑话列表 `juicer` 调用导致空白的 bug；修复首页百家图片仍指向失效域名的问题。

### 重新生成模拟数据 / 素材

```bash
python tools/gen_assets.py      # 生成 audio/song_*.wav、img/{covers,baijia,jokes}/*.svg、mock/data.json
```

> 纯 Python 标准库实现，无需任何第三方依赖。改完数据后重启 `server.js` 即可生效。

## 本地运行

```bash
# 需要 Node.js（>=18，已内置 fetch；推荐用 managed node）
node server.js
# 或用 managed node：
# ~/.workbuddy/binaries/node/versions/22.22.2-6/node.exe server.js
```

启动后访问：**http://localhost:8080**

### 后端数据结构（前后端一体）

```
server.js              # 入口：静态托管 + /app_backend/*.php 路由分发
mobile/                # APK 打包工程（Capacitor，详见「打包成 APK」）
  capacitor.config.json   # appId=com.lekaixin.app / 应用名 / webDir=www
  package.json            # @capacitor 依赖（www/、android/、node_modules/ 为生成物，已 gitignore）
tools/
  build_mobile.js     # 组装 mobile/www 并注入远程 API 地址（--host https://api.example.com）
  gen_assets.py       # 生成 audio/song_*.wav、img/{covers,baijia,jokes}/*.svg、mock/data.json
backend/
  config.js           # 密钥/cookie/USE_REMOTE 开关（默认 false = 本地 mock）
  http.js            # 等价原 common.php 的 get_curl()（fetch + 伪装头 + 超时）
  reply.js           # 统一响应辅助（sendJSON/sendHTML/sendText/sendBuffer）
  mock.js            # 读取 mock/data.json 并提供 getter
  index.js           # 路由表：*.php -> handler
  routes/
    joke.js          # getjoke.php      -> ShowAPI 笑话（route.showapi.com/341-2）
    news.js          # getnews.php / getnews_content.php -> 新闻聚合（多源中文 RSS：爱范儿/极客公园/IT之家/少数派，替代百度百家）；详情页全文：RSS 自带全文 -> 补拉 feed -> 页面抓取，白名单清洗
    music.js         # getchannels.php / getmusic.php / getlrc.php / getlrc_content.php -> Audius / 网易云（替代豆瓣FM）
    image.js         # getimage.php     -> 图片代理（本地读取 / 远端防盗链代理）
    about.js         # rabit.php        -> 关于页
    saveInfo.js      # saveInfo.php     -> 用户注册（原 MySQL -> 本地 JSON 文件）
    topic.js         # gettopic.php / topicdetail.php -> QQ 部落（前端未使用）
  data/users.json    # saveInfo 写入的本地用户数据
```

> 每个 handler 内部：`USE_REMOTE=true` 时尝试真实转发原上游接口；失败（网络/密钥失效/上游停服）则**自动回退本地 mock**，保证服务始终可用。

### 启用真实远端后端（可选）

原上游多为第三方服务（ShowAPI、百度百家、豆瓣FM、geci.me、QQ 部落），部分已停服或需有效密钥。如需启用真实数据：

```bash
# 方式一：环境变量（推荐）
set LK_USE_REMOTE=1                 # Windows；Linux/Mac: export LK_USE_REMOTE=1
# 按需覆盖密钥（默认是历史写死的失效值）
set LK_SHOWAPI_APPID=你的appid
set LK_SHOWAPI_SECRET=你的secret
node server.js

# 方式二：直接改 backend/config.js 里的 USE_REMOTE = true
```

⚠️ 默认密钥（appid `15384`、百度/geci apikey）已失效，ShowAPI 会返回「暂无数据」并回退本地 mock；豆瓣 FM 等上游已停服，同样回退。请自行替换为有效凭证。

首页展示「笑话 / 电台 / 百家 / 关于」四个 tab（百家现已改为「新闻聚合」）；点击笑话/新闻列表项会跳转对应子页面（新闻详情直接显示原文全文，抓取失败才回退摘要+阅读原文）；电台页可播放真实流媒体音乐，支持上一首/下一首/点击歌单切换。

## 数据源切换（豆瓣 FM / 百度百家 已停服，改用开源接口）

| 模块 | 默认源 | 可切换源 | 配置 | 失败回退 |
| --- | --- | --- | --- | --- |
| 音乐（替代豆瓣 FM） | **Audius**（开源去中心化，免 key、可直接流式播放） | 网易云音乐 `NeteaseCloudMusicApi`（中文歌曲） | `LK_USE_MUSIC=audius|netease`、`LK_NCM_API=网易云服务地址` | netease→audius→本地 mock |
| 新闻（替代百度百家） | **多源中文 RSS 聚合**（爱范儿 / 极客公园 / IT之家 / 少数派，开源免 key） | 可自定义 RSS 源（`LK_NEWS_FEEDS`） | `LK_NEWS_FEEDS=JSON`、`LK_NEWS_SIZE=30` | 本地 mock |

> 新闻详情全文：爱范儿/极客公园/IT之家的 feed 自带全文（`content:encoded`/`description`），列表加载即入缓存；少数派等仅摘要的源走服务端页面抓取（零依赖正则提取 + 白名单清洗）；两者都失败前端回退摘要 + 阅读原文。
| 笑话（默认免 key 中文段子） | **素颜API 随机段子**（`api.suyanw.cn`，免 key、中文，并发多次调用组装列表） | ShowAPI 笑话大全（中文，需免费注册的 appid/secret）；JokeAPI v2（英文，免 key） | `LK_USE_JOKE=suyanw\|showapi\|jokeapi`、`LK_JOKE_SIZE=10`、`LK_SHOWAPI_APPID/SECRET` | showapi→suyanw→jokeapi→本地 mock |

```bash
# 音乐切到网易云（需先自行部署 NeteaseCloudMusicApi，默认 http://localhost:3000）
set LK_USE_MUSIC=netease
set LK_NCM_API=http://localhost:3000
node server.js

# 自定义新闻 RSS 源（JSON 字符串，覆盖默认 4 个中文源）
set LK_NEWS_FEEDS=[{"url":"https://www.ifanr.com/feed","source":"爱范儿"}]
node server.js
```

> 网易云音乐 API 开源项目：https://github.com/Binaryify/NeteaseCloudMusicApi （或其维护分支）。
> 所有远程接口拉取失败时均自动回退本地 mock，保证离线也能运行。

```bash
# 笑话切到 ShowAPI（中文，需注册免费额度：https://www.showapi.com/ ，接口 341-2）
set LK_USE_JOKE=showapi
set LK_SHOWAPI_APPID=你的appid
set LK_SHOWAPI_SECRET=你的secret
node server.js
```

## 打包成 APK（Android）

APK 的 WebView 里跑不了 Node 后端，所以打包分两步：**先把 `server.js` 部署到公网（HTTPS）**，**再把前端静态资源打进 APK**。页面 `access_host` 已支持构建时注入远程地址（`window.LK_API_HOST`），浏览器开发模式不受影响。

### 1. 部署后端到公网（宝塔面板）

**特点：零 npm 依赖**（仅用 Node 内置模块 `http/fs/path/url/crypto`），不需要 `npm install`，不需要 `package.json`，Node ≥ 18 即可运行。

#### 1.1 上传代码到服务器

> **只传 `server.js` 跑不起来**：它运行时依赖 `backend/`（全部路由）、`mock/data.json`（回退数据），同时还兼作静态服务器托管前端页面（`index.html`/`css`/`js`/`img`/`fonts`/`plus` 等）。整个项目也就 1.5MB，直接整包上传最省心。

**方式一：本机打包（推荐，生成精确最小集）**

```bash
node tools/pack_server.js          # 白名单复制运行时必需文件到 dist/server/（约 1.5MB）
tar -czf dist/lekaixin-server.tar.gz -C dist/server .
```

把 `dist/lekaixin-server.tar.gz` 通过宝塔「文件」菜单上传，在站点目录解压：

```bash
mkdir -p /www/wwwroot/lekaixin
tar -xzf lekaixin-server.tar.gz -C /www/wwwroot/lekaixin
```

脚本已排除：`mobile/`（APK 工程）、`tools/`、`unpackage/`、`.github/`、`.workbuddy/`、`audio/`（5.7MB 旧 demo 音乐，零引用）、`*.md`。

**方式二：服务器上 git clone**

```bash
cd /www/wwwroot
git clone <你的仓库地址> lekaixin
cd lekaixin && rm -rf mobile .workbuddy audio unpackage tools
```

#### 1.2 安装 Node 运行环境

宝塔「软件商店」搜索安装 **Node 版本管理器**（或旧版的 **PM2 管理器**，自带多版本 Node）。

#### 1.3 添加 Node 项目（PM2 守护 + 自动反代）

宝塔「网站」菜单 → **Node 项目** → 添加：

| 配置项 | 值 |
|---|---|
| 项目目录 | `/www/wwwroot/lekaixin` |
| 项目名称 | `lekaixin` |
| 启动选项 | `自定义启动命令`：`node server.js` |
| 运行端口 | `8080`（或任意未被占用端口） |
| Node 版本 | ≥ 18（推荐 20/22 LTS） |
| 环境变量 | 见下方清单，按需填写 |

创建后宝塔会自动：PM2 守护进程 + 开机自启 + Nginx 反代到该端口 + 崩溃自动重启。

> 如果宝塔版本没有「Node 项目」入口：用 PM2 管理器手动添加（启动文件 `server.js`），再按 1.5 手动配 Nginx 反代。

**环境变量清单**（PM2 里「环境变量」区填写，不配则全部走代码内默认值）：

| 变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | `8080` | 服务监听端口，需与上面「运行端口」一致 |
| `LK_USE_JOKE` | `suyanw` | 笑话源：`suyanw`（免 key 中文）/`showapi`（需密钥）/`jokeapi`（英文） |
| `LK_SHOWAPI_APPID` / `LK_SHOWAPI_SECRET` | 失效值 | 仅 `LK_USE_JOKE=showapi` 时生效，注册地址 showapi.com 接口 341-2 |
| `LK_USE_MUSIC` | `audius` | 音乐源：`audius`（免 key 流媒体）/`netease`（需自部署网易云 API） |
| `LK_NCM_API` | `http://localhost:3000` | 仅 `netease` 模式：网易云 API 地址 |
| `LK_NEWS_SIZE` | `30` | 新闻列表条数 |
| `LK_TIMEOUT` | `8000` | 上游请求超时（毫秒） |

> 电台/新闻/笑话的开源免 key 数据源（Audius / 多源 RSS / 素颜段子）**不受任何开关控制，始终优先远端，失败自动回退本地 mock**——部署后无需任何配置即有真实数据。

#### 1.4 绑定域名 + HTTPS

1. 「网站」→ 该站点 → **站点设置 → 网站目录**：确认运行目录 `/www/wwwroot/lekaixin`，**不要**勾选防跨站攻击（会写 `.user.ini`，纯静态项目不需要）。
2. **SSL** → Let's Encrypt → 勾选域名申请（域名需先解析到服务器 IP）。宝塔自动开启 443 反代。
3. 若域名在 Cloudflare 橙云代理后：SSL/TLS 模式选 **Full**，源站 Let's Encrypt 证书即可；想源站 IP 隐藏则保持代理开启，宝塔防火墙不必放行非 80/443。

#### 1.5 Nginx 反代配置（手动方式备用）

站点「配置文件」中，`location /` 替换为：

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # 静态资源可加缓存（接口 /app_backend/ 不缓存）
    # location ~* \.(css|js|png|jpg|svg|woff2)$ { expires 7d; }
}
```

#### 1.6 自检

```bash
curl http://127.0.0.1:8080/app_backend/getjoke.php      # 本机直连：应返回 10 条段子 JSON
curl https://你的域名/app_backend/getnews.php            # 经 Nginx+HTTPS：30 条新闻
curl https://你的域名/app_backend/getchannels.php        # 电台频道
```

任一接口返回 JSON 即部署成功；远端数据源瞬时抖动时会自动回退本地 mock，不会 500。

#### 1.7 日常更新

```bash
cd /www/wwwroot/lekaixin && git pull && pm2 restart lekaixin
```

### 2. 组装 Web 资源

```bash
node tools/build_mobile.js --host https://api.example.com
```

只打包纯前端静态文件到 `mobile/www/`（`backend/`、`mock/`、`server.js`、5.7MB 旧 demo 音乐 `audio/` 全部排除），并把后端地址注入全部 6 个 HTML 页面。

### 3. 构建 APK（三选一）

**方式 A：GitHub Actions 云构建（推荐，无需本地 Android 环境）**

推送代码后到仓库 Actions → 「Build APK」→ Run workflow，填写后端地址即可，产物在 Artifacts 里下载。工作流见 `.github/workflows/build-apk.yml`。

**方式 B：本地 Android Studio（最直观）**

1. 安装 Android Studio（自带 JDK 与 SDK）
2. `cd mobile && npm install && npx cap add android && npx cap sync android`（`android/` 已 gitignore，首次需 add）
3. 用 Android Studio 打开 `mobile/android` 目录 → 等 Gradle Sync → Build > Build APK(s)
4. 产物：`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

**方式 C：命令行（本机已装 JDK 17+ 与 Android SDK）**

```bash
cd mobile/android && ./gradlew assembleDebug    # Windows 用 gradlew.bat
```

> 本机工具链（scoop 安装，scoop 已自动设置用户级 `JAVA_HOME` / `ANDROID_HOME` 并加入 PATH，新开终端生效）：
> ```bash
> scoop bucket add java
> scoop install temurin21-jdk        # JDK 21（17+ 均可）
> scoop install android-clt          # 官方 cmdline-tools（含 sdkmanager）
> export JAVA_HOME='C:\Users\fujia\scoop\apps\temurin21-jdk\current'
> sdkmanager --licenses              # 首次需接受许可（yes | sdkmanager --licenses）
> sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
> ```
> SDK 位置：`C:\Users\fujia\scoop\apps\android-clt\current`（已写入 `mobile/android/local.properties` 的 `sdk.dir`，该文件 gitignore）。
> 国内网络：Gradle 发行包可从腾讯云镜像下载放到 `~/.gradle/wrapper/dists/gradle-8.11.1-all/<hash>/` 下（services.gradle.org 较慢）；已实测构建通过，产物 `mobile/android/app/build/outputs/apk/debug/app-debug.apk`。

### 4. 签名与图标（可选）

debug 包可直接安装测试；上架需 release 签名（Android Studio → Generate Signed Bundle/APK，或配 `signingConfig` 后 `./gradlew assembleRelease`）。图标/启动图可用 `@capacitor/assets` 从 1024×1024 源图生成：

```bash
npm i -D @capacitor/assets && npx capacitor-assets generate --android
```

### 注意事项

- **后端必须 HTTPS**：Android 9+ 默认禁止明文流量；本地联调如用 HTTP（如 `http://192.168.x.x:3000`），需在 `mobile/android/app/src/main/AndroidManifest.xml` 的 `<application>` 上加 `android:usesCleartextTraffic="true"`（仅调试用）。
- **接口跨域**：APK 内页面 origin 是 `https://localhost`，访问远程后端走 CORS；`backend/reply.js` 已对所有响应加 `Access-Control-Allow-Origin: *`。
- **真机返回键 / 5+ API**：`plus` 在 WebView 中不存在，代码已做浏览器降级（`mui.os.plus` 判断），不影响使用。
- **应用信息**：`appId=com.lekaixin.app`、应用名「乐开心」、minSdk 23（Android 6.0+），配置见 `mobile/capacitor.config.json`。

## 模拟接口（路由见 backend/index.js）

| 接口 | 实现 | 说明 |
| --- | --- | --- |
| `GET /app_backend/getjoke.php?p=N` | `routes/joke.js` | 笑话列表（JSON 数组），默认素颜API 中文段子（免 key） |
| `GET /app_backend/getchannels.php` | `routes/music.js` | 当前音乐源的频道列表（JSON），Audius 按风格 / 网易云按榜单 |
| `GET /app_backend/getnews.php` | `routes/news.js` | 新闻聚合列表（JSON 数组），替代百度百家 |
| `GET /app_backend/getnews_content.php?url=` | `routes/news.js` | 新闻原文正文（JSON：`{ok, html}`），详情页直接显示全文；失败 `{ok:false}` 前端回退摘要+阅读原文 |
| `GET /app_backend/getbaijia.php` | `routes/news.js` | 兼容别名，同 getnews.php |
| `GET /app_backend/getbaijia_content.php?id=` | `routes/news.js` | 兼容别名，同 getnews_content.php |
| `GET /app_backend/getmusic.php?id=` | `routes/music.js` | 某频道歌曲列表（JSON），Audius / 网易云 |
| `GET /app_backend/getlrc.php?song=` | `routes/music.js` | 歌词地址（JSON token），原 geci.me |
| `GET /app_backend/getlrc_content.php?url=` | `routes/music.js` | 歌词文本（LRC） |
| `GET /app_backend/getimage.php?url=` | `routes/image.js` | 图片代理（本地读取 / 远端防盗链代理） |
| `GET /app_backend/rabit.php` | `routes/about.js` | 关于页（HTML） |
| `POST /app_backend/saveInfo.php` | `routes/saveInfo.js` | 用户注册（原 MySQL -> 本地 JSON 文件） |
| `GET /app_backend/gettopic.php` | `routes/topic.js` | QQ 部落列表（前端未使用） |
| `GET /app_backend/topicdetail.php?tid=` | `routes/topic.js` | QQ 部落详情（前端未使用） |

前端无需改动：接口路径与原 PHP 完全一致，`access_host` 已指向本地 `/app_backend/`。

## 说明

项目根目录原有 `.git` 中 `HEAD` 指向无效引用，已从远程 `git@github.com:dreamfly2012/lekaixin.git` 的 `master` 拉取恢复代码（commit `61b673a remove apk package`）。
