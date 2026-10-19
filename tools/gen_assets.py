# -*- coding: utf-8 -*-
"""
乐开心 (lekaixin) 本地模拟数据生成器
-------------------------------------
纯 Python 标准库实现，无需任何第三方依赖。

生成内容：
  1. audio/song_NN.wav        —— 每首歌一段真实可播放的旋律（合成音频）
  2. img/covers/cover_NN.svg  —— 每首歌的真实封面插画
  3. img/baijia/bjNNNN.svg    —— 每篇百家文章的配图插画
  4. img/jokes/jkNN.svg       —— 每条笑话的配图插画
  5. mock/data.json           —— 结构化模拟数据（歌曲/歌词/百家/笑话/关于页）

运行：  python tools/gen_assets.py
"""
import os
import math
import struct
import json
import random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ------------------------------------------------------------------ #
# 1. 歌曲目录（与原项目三个频道一致）
# ------------------------------------------------------------------ #
SONGS_ORDER = [
    # channel 0 私人兆赫
    ("友谊地久天长", "苏格兰民歌", "0"),
    ("晚风",         "老鹰乐队",   "0"),
    ("夜的第七章",   "周杰伦",     "0"),
    ("晴天",         "周杰伦",     "0"),
    ("后来",         "刘若英",     "0"),
    # channel 1 华语
    ("稻香",         "周杰伦",     "1"),
    ("青花瓷",       "周杰伦",     "1"),
    ("七里香",       "周杰伦",     "1"),
    ("枫",           "周杰伦",     "1"),
    ("彩虹",         "周杰伦",     "1"),
    # channel 2 欧美
    ("Shape of You",     "Ed Sheeran", "2"),
    ("Perfect",         "Ed Sheeran", "2"),
    ("Blinding Lights",  "The Weeknd", "2"),
    ("Someone Like You", "Adele",      "2"),
    ("Levitating",       "Dua Lipa",   "2"),
]

CHANNEL_NAMES = {"0": "私人兆赫", "1": "华语", "2": "欧美"}
# 频道根音（C4 / D4 / E4）与配色
CHANNEL_ROOT = {"0": 261.63, "1": 293.66, "2": 329.63}
CHANNEL_COLORS = {
    "0": ("#1f6feb", "#0b3d91"),   # 蓝
    "1": ("#e8590c", "#b4231f"),   # 暖红金
    "2": ("#7048e8", "#3b1f8f"),   # 紫
}

# 每首歌的原创短歌词（避免版权，纯示意文本）
LYRICS = {
    "友谊地久天长": "[00:00.00]友谊地久天长\n[00:05.20]怎能忘记旧日朋友\n[00:10.40]心中能不怀想\n[00:15.60]旧日朋友岂能相忘\n[00:20.80]友谊地久天长\n[00:26.00]我们曾经终日游荡\n[00:31.20]在故乡的青山上",
    "晚风": "[00:00.00]晚风轻拂过山岗\n[00:05.00]吹散白日的匆忙\n[00:10.00]我把心事交给星空\n[00:15.00]等一场温柔的梦\n[00:20.00]晚风请你慢些走\n[00:25.00]陪我把夜色看够",
    "夜的第七章": "[00:00.00]夜色翻开第七章\n[00:05.00]月光写在窗台上\n[00:10.00]谜底藏在风里面\n[00:15.00]谁在轻声哼着念想\n[00:20.00]故事走到第七章\n[00:25.00]天快亮了别慌张",
    "晴天": "[00:00.00]故事的小黄花\n[00:05.00]从出生那年就飘着\n[00:10.00]童年的荡秋千\n[00:15.00]随记忆一直晃到现在\n[00:20.00]吹着前奏望着天空\n[00:25.00]我想起花瓣试着掉落",
    "后来": "[00:00.00]后来我总算学会了\n[00:05.00]如何去爱\n[00:10.00]可惜你早已远去\n[00:15.00]消失在人海\n[00:20.00]后来终于在眼泪中\n[00:25.00]明白有些人一旦错过",
    "稻香": "[00:00.00]对这个世界如果你有太多的抱怨\n[00:05.00]跌倒了就不敢继续往前走\n[00:10.00]为什么人要这么的脆弱\n[00:15.00]请你打开电视看看\n[00:20.00]多少人为生命在努力\n[00:25.00]勇敢的走下去",
    "青花瓷": "[00:00.00]素胚勾勒出青花笔锋浓转淡\n[00:05.00]瓶身描绘的牡丹一如你初妆\n[00:10.00]冉冉檀香透过窗心事我了然\n[00:15.00]宣纸上走笔至此搁一半\n[00:20.00]釉色渲染仕女图韵味被私藏",
    "七里香": "[00:00.00]窗外的麻雀在电线杆上多嘴\n[00:05.00]你说这一句很有夏天的感觉\n[00:10.00]手中的铅笔在纸上来来回回\n[00:15.00]我用几行字形容你是我的谁\n[00:20.00]秋刀鱼的滋味猫跟你都想了解",
    "枫": "[00:00.00]乌云在我们心里搁下一块阴影\n[00:05.00]我聆听沉寂已久的心情\n[00:10.00]清晰透明的你空气中找寻你\n[00:15.00]有些事情总说不清\n[00:20.00]只是感觉 lost in the song",
    "彩虹": "[00:00.00]哪里有彩虹告诉我\n[00:05.00]能不能把我的愿望还给我\n[00:10.00]为什么天这么安静\n[00:15.00]所有的云都跑到我这里\n[00:20.00]有没有口罩让我呼吸",
    "Shape of You": "[00:00.00]The club isn't the best place to find a lover\n[00:05.00]So the bar is where I go\n[00:10.00]Me and my friends at the table doing shots\n[00:15.00]Drinking fast and then we talk slow\n[00:20.00]Come over and start up a conversation",
    "Perfect": "[00:00.00]I found a love for me\n[00:05.00]Darling just dive right in and follow my lead\n[00:10.00]Well I found a girl beautiful and sweet\n[00:15.00]Oh I never knew you were the someone waiting for me\n[00:20.00]Cause we were just kids",
    "Blinding Lights": "[00:00.00]I've been tryna call\n[00:05.00]I've been on my own for long enough\n[00:10.00]Maybe you can show me how to love\n[00:15.00]When it's over, I'm the one who's lost it all\n[00:20.00]I'm off the deep end",
    "Someone Like You": "[00:00.00]I heard that you're settled down\n[00:05.00]That you found a girl and you're married now\n[00:10.00]I heard that your dreams came true\n[00:15.00]Guess she gave you things I didn't give to you\n[00:20.00]Old friend, why are you so shy",
    "Levitating": "[00:00.00]If you wanna run away with me\n[00:05.00]I know a galaxy and I can take you for a ride\n[00:10.00]I had a premonition that we fell into a rhythm\n[00:15.00]Where the music don't stop for life\n[00:20.00]Glitter in the sky",
}

# ------------------------------------------------------------------ #
# 2. 百家文章（标题 / 摘要 / 主题 / 正文）
# ------------------------------------------------------------------ #
BAIJIA = [
    {
        "ID": 1001,
        "m_title": "今日趣闻：橘猫占领了图书馆",
        "m_summary": "一只橘猫连续三天光顾市图书馆，已经成为读者们的团宠与“常驻管理员”。",
        "theme": "cat",
        "body": [
            "周三上午，市图书馆的阅览室里多了一位“不速之客”——一只胖乎乎的橘猫，正大摇大摆地趴在归还台上，仿佛在检查每一本书的借阅记录。",
            "据馆员介绍，这只橘猫已经连续三天准时“上班”，读者们自发给它起了名字叫“管理员二号”。有人专门带猫条来“上供”，也有人在社交平台晒出它打盹的照片，迅速登上本地热搜。",
            "图书馆方面表示，只要不影响正常秩序，欢迎这位特殊读者“打卡”。不过也提醒市民：投喂请适度，别把猫喂得太圆，毕竟它还要爬书架。"
        ],
    },
    {
        "ID": 1002,
        "m_title": "科技前沿：可折叠屏幕再进化",
        "m_summary": "新一代柔性屏在耐折次数上实现数量级突破，折叠屏手机离“随便折”又近了一步。",
        "theme": "tech",
        "body": [
            "近日，多家面板厂商披露了新一代柔性 OLED 的最新测试数据：在常温环境下，屏幕可承受的折叠次数从此前的二十万次提升到超过一百万次，相当于每天折一百次也能用上二十七年。",
            "更关键的是折痕问题得到明显改善。通过新型中性层材料与更薄的封装结构，展开后的可见折痕在多数光线条件下几乎不可见，观感接近直板屏。",
            "行业分析师认为，随着良率提升与成本下探，折叠屏有望在两年内从“旗舰尝鲜”走向“主流标配”，改写手机的形态定义。"
        ],
    },
    {
        "ID": 1003,
        "m_title": "生活家：十分钟搞定一周早餐",
        "m_summary": "三款高蛋白快手食谱，让你告别饿着肚子上班的早晨。",
        "theme": "food",
        "body": [
            "工作日最难的不是起床，而是“今天吃什么”。其实只要周末花十分钟备餐，就能换来一整周的从容。",
            "第一款：隔夜燕麦。燕麦、牛奶、奇亚籽与香蕉睡前拌匀放冰箱，早上直接吃；第二款：茶叶蛋+全麦面包，蛋白质与碳水一次补齐；第三款：提前蒸好的鸡蛋羹，微波三十秒即食。",
            "三款轮换不重样，蛋白质拉满、耗时极短。坚持一周，你会发现上午的注意力都更稳了。"
        ],
    },
    {
        "ID": 1004,
        "m_title": "旅行志：小众古镇的慢生活",
        "m_summary": "避开人潮，这些藏在山水间的小镇，藏着最舒服的周末。",
        "theme": "travel",
        "body": [
            "如果你也受够了人挤人的网红景点，不如把目光投向那些未被过度开发的水乡小镇。没有排队两小时的网红店，只有清晨的薄雾和吱呀作响的木桥。",
            "白天可以沿河慢走，看老人在桥头晒太阳；入夜后找一家临水民宿，听雨打青瓦。节奏慢下来，连呼吸都变得轻盈。",
            "建议工作日前往，住宿与体验都更安静。带上书和相机，把手机调成免打扰，这趟旅程的意义本就是“什么都不做”。"
        ],
    },
    {
        "ID": 1005,
        "m_title": "健康课：久坐族的拉伸指南",
        "m_summary": "五个动作缓解腰酸背痛，办公室也能练。",
        "theme": "health",
        "body": [
            "长时间伏案，颈椎与腰椎最先“抗议”。其实每隔一小时花三分钟拉伸，就能显著缓解僵硬。",
            "动作一：扩胸后仰，打开胸椎；动作二：坐姿体前屈，放松下背；动作三：颈部侧拉伸；动作四：站姿髋屈肌拉伸；动作五：踝泵促进循环。每个动作保持 20 秒，循序渐进。",
            "拉伸不是越痛越有效，感到轻微牵拉感即可。坚持两周，肩颈的“紧绷感”会明显减轻。"
        ],
    },
    {
        "ID": 1006,
        "m_title": "影评：今年最被低估的一部国产片",
        "m_summary": "没有大牌，却把普通人的故事讲进了心里。",
        "theme": "film",
        "body": [
            "今年的院线片里，这部小成本作品是最被低估的一匹黑马。没有流量明星，没有宏大特效，镜头却牢牢钉在普通人身上。",
            "导演用近乎纪录片的质感，拍下了一对父子在时代缝隙里的拉扯。台词克制，情绪却绵密，散场后很久都走不出来。",
            "它提醒我们：好电影不靠声量取胜，而靠真诚。如果你厌倦了爆米花式的喧嚣，这部值得走进影院认真看一次。"
        ],
    },
]

# ------------------------------------------------------------------ #
# 3. 笑话（标题 / 配图主题 / 正文）
# ------------------------------------------------------------------ #
JOKES = [
    ("程序员去超市", "dev", "程序员去超市买东西，老板问：要几个？程序员：先给我来一个，我再循环要剩下的。"),
    ("Bug 的哲学", "bug", "世界上唯一不变的就是 Bug 永远改不完。"),
    ("面试", "dev", "面试官：你会什么？我：我会让程序跑起来。面试官：可它现在跑不起来。我：所以我才来面试。"),
    ("时钟", "clock", "秒针对分针说：你走一步我得走六十步，这就是职场。"),
    ("Wi-Fi", "wifi", "世界上最远的距离，是满格 Wi-Fi 却连不上。"),
    ("减肥", "food", "我减肥的方法很简单：把“明天开始”这四个字念了一年。"),
    ("开会", "meeting", "一个小时的会，前五十分钟在等人，后十分钟决定了下次会议的时间。"),
    ("猫", "cat", "猫主子调试代码的方式：把你的键盘当床。"),
    ("咖啡", "coffee", "程序员的三大支柱：咖啡、代码、和“再试一次”。"),
    ("加班", "bug", "加班不可怕，可怕的是加班后发现 Bug 是上午自己写的。"),
]

# ------------------------------------------------------------------ #
# SVG 生成辅助
# ------------------------------------------------------------------ #
def xml_escape(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;").replace("'", "&apos;"))


def svg_note(cx, cy, s, color):
    """一个简单的音符图标（八分音符）路径。"""
    return (
        f'<ellipse cx="{cx}" cy="{cy}" rx="{s*0.28:.1f}" ry="{s*0.2:.1f}" '
        f'transform="rotate(-20 {cx} {cy})" fill="{color}"/>'
        f'<rect x="{cx+s*0.24:.1f}" y="{cy-s*1.1:.1f}" width="{s*0.09:.1f}" height="{s*1.0:.1f}" fill="{color}"/>'
    )


def cover_svg(title, artist, c1, c2):
    """歌曲封面：渐变背景 + 黑胶唱片 + 音符 + 文字。"""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{c1}"/>
      <stop offset="1" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <circle cx="300" cy="250" r="150" fill="#111" opacity="0.55"/>
  <circle cx="300" cy="250" r="150" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2"/>
  <circle cx="300" cy="250" r="48" fill="#fff" opacity="0.9"/>
  <circle cx="300" cy="250" r="14" fill="{c2}"/>
  {svg_note(430, 180, 120, "#ffffff")}
  <text x="300" y="470" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="40" font-weight="bold" fill="#ffffff">{xml_escape(title)}</text>
  <text x="300" y="520" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="24" fill="#ffffff" fill-opacity="0.85">{xml_escape(artist)}</text>
</svg>'''


def baijia_svg(theme, title, c1, c2):
    """百家配图：渐变背景 + 主题图标 + 标题。"""
    icon = {
        "cat":   '<circle cx="300" cy="180" r="60" fill="#fff" opacity="0.9"/><circle cx="278" cy="165" r="8" fill="#222"/><circle cx="322" cy="165" r="8" fill="#222"/><path d="M270 205 q30 24 60 0" stroke="#222" stroke-width="5" fill="none"/>',
        "tech":  '<rect x="250" y="130" width="100" height="100" rx="10" fill="#fff" opacity="0.9"/><rect x="270" y="150" width="60" height="8" rx="4" fill="{c2}"/><rect x="270" y="170" width="60" height="8" rx="4" fill="{c2}"/><rect x="270" y="190" width="40" height="8" rx="4" fill="{c2}"/>',
        "food":  '<circle cx="300" cy="180" r="58" fill="#fff" opacity="0.9"/><path d="M280 180 a20 20 0 0 1 40 0" stroke="{c2}" stroke-width="6" fill="none"/>',
        "travel":'<path d="M250 210 L300 140 L350 210 Z" fill="#fff" opacity="0.9"/><rect x="290" y="210" width="20" height="30" fill="#fff" opacity="0.9"/>',
        "health":'<circle cx="300" cy="180" r="55" fill="none" stroke="#fff" stroke-opacity="0.9" stroke-width="8"/><path d="M278 180 h14 l8 -16 l12 32 l10 -24 h12" stroke="#fff" stroke-width="6" fill="none"/>',
        "film":  '<rect x="255" y="140" width="90" height="80" rx="8" fill="#fff" opacity="0.9"/><circle cx="300" cy="180" r="22" fill="{c2}"/>',
    }.get(theme, '<circle cx="300" cy="180" r="55" fill="#fff" opacity="0.9"/>')
    icon = icon.format(c2=c2)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{c1}"/>
      <stop offset="1" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="340" fill="url(#g)"/>
  {icon}
  <rect x="0" y="270" width="600" height="70" fill="#000" opacity="0.35"/>
  <text x="300" y="312" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="26" font-weight="bold" fill="#ffffff">{xml_escape(title)}</text>
</svg>'''


def joke_svg(theme, title, c1, c2):
    """笑话配图：渐变背景 + 表情/图标。"""
    face = {
        "dev":    '<rect x="250" y="120" width="100" height="70" rx="8" fill="#fff" opacity="0.92"/><text x="300" y="172" text-anchor="middle" font-size="44" fill="{c2}">&lt;/&gt;</text>',
        "bug":    '<circle cx="300" cy="160" r="50" fill="#fff" opacity="0.92"/><text x="300" y="182" text-anchor="middle" font-size="50" fill="{c2}">🐞</text>',
        "clock":  '<circle cx="300" cy="160" r="52" fill="#fff" opacity="0.92"/><line x1="300" y1="160" x2="300" y2="125" stroke="{c2}" stroke-width="5"/><line x1="300" y1="160" x2="328" y2="160" stroke="{c2}" stroke-width="5"/>',
        "wifi":   '<path d="M265 175 a40 40 0 0 1 70 0" stroke="#fff" stroke-width="6" fill="none" opacity="0.9"/><path d="M278 188 a22 22 0 0 1 44 0" stroke="#fff" stroke-width="6" fill="none" opacity="0.9"/><circle cx="300" cy="200" r="5" fill="#fff"/>',
        "food":   '<circle cx="300" cy="160" r="50" fill="#fff" opacity="0.92"/><path d="M280 160 a20 20 0 0 1 40 0" stroke="{c2}" stroke-width="6" fill="none"/>',
        "meeting":'<rect x="255" y="135" width="90" height="55" rx="6" fill="#fff" opacity="0.92"/><circle cx="278" cy="162" r="9" fill="{c2}"/><circle cx="322" cy="162" r="9" fill="{c2}"/>',
        "cat":    '<circle cx="300" cy="160" r="52" fill="#fff" opacity="0.92"/><circle cx="282" cy="152" r="6" fill="{c2}"/><circle cx="318" cy="152" r="6" fill="{c2}"/><path d="M286 172 q14 12 28 0" stroke="{c2}" stroke-width="4" fill="none"/>',
        "coffee": '<path d="M270 150 h50 v30 a25 25 0 0 1 -50 0 z" fill="#fff" opacity="0.92"/><path d="M320 158 h12 a10 10 0 0 1 0 20 h-12" stroke="#fff" stroke-width="5" fill="none" opacity="0.92"/>',
    }.get(theme, '<circle cx="300" cy="160" r="50" fill="#fff" opacity="0.92"/>')
    face = face.format(c2=c2)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{c1}"/>
      <stop offset="1" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#g)"/>
  {face}
  <text x="200" y="262" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">{xml_escape(title)}</text>
</svg>'''


# ------------------------------------------------------------------ #
# 4. 旋律合成（真实可播放音频）
# ------------------------------------------------------------------ #
def midi_freq(semi_from_a4):
    return 440.0 * (2.0 ** (semi_from_a4 / 12.0))


def build_melody_wav(song_index, root_freq, sr=22050):
    """生成一段约 10 秒的旋律，返回 16-bit PCM 单声道字节。"""
    rng = random.Random(song_index * 1000 + 7)
    # 大调五声音阶相对半音（跨两个八度）
    pent = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]
    # 固定的旋律走向（索引 pent 数组）
    seq = [0, 2, 4, 3, 5, 4, 2, 1, 3, 5, 7, 5, 4, 2, 0, 2, 4, 6, 3, 1]
    transpose = (song_index * 2) % 12  # 每首歌移调，听感不同
    samples = []
    gain = 0.28
    for idx in seq:
        semi = pent[idx] + transpose
        freq = root_freq * (2.0 ** (semi / 12.0))
        dur = 0.34 + 0.10 * rng.random()
        n = int(sr * dur)
        # 包络：快速起音 + 尾部释放，避免爆音
        for i in range(n):
            t = i / sr
            env = min(t / 0.02, 1.0) * min((dur - t) / 0.05, 1.0)
            env = max(env, 0.0)
            # 基频 + 两个泛音，音色更饱满
            s = (math.sin(2 * math.pi * freq * t)
                 + 0.4 * math.sin(2 * math.pi * 2 * freq * t)
                 + 0.2 * math.sin(2 * math.pi * 3 * freq * t))
            samples.append(int(gain * env * s * 32767))
    # 整体归一化到避免削波
    peak = max(1, max(abs(x) for x in samples))
    scale = 30000 / peak
    out = b''.join(struct.pack('<h', max(-32768, min(32767, int(x * scale)))) for x in samples)
    return out, sr


def write_wav(path, pcm, sr):
    n = len(pcm) // 2
    with open(path, 'wb') as f:
        f.write(b'RIFF')
        f.write(struct.pack('<I', 36 + len(pcm)))
        f.write(b'WAVE')
        f.write(b'fmt ')
        f.write(struct.pack('<IHHIIHH', 16, 1, 1, sr, sr * 2, 2, 16))
        f.write(b'data')
        f.write(struct.pack('<I', len(pcm)))
        f.write(pcm)


# ------------------------------------------------------------------ #
# 5. 主流程
# ------------------------------------------------------------------ #
def main():
    audio_dir = os.path.join(ROOT, "audio")
    covers_dir = os.path.join(ROOT, "img", "covers")
    baijia_dir = os.path.join(ROOT, "img", "baijia")
    jokes_dir = os.path.join(ROOT, "img", "jokes")
    mock_dir = os.path.join(ROOT, "mock")
    for d in (audio_dir, covers_dir, baijia_dir, jokes_dir, mock_dir):
        os.makedirs(d, exist_ok=True)

    songs_by_channel = {"0": [], "1": [], "2": []}
    lyrics_by_title = {}

    for i, (title, artist, ch) in enumerate(SONGS_ORDER, start=1):
        c1, c2 = CHANNEL_COLORS[ch]
        # 音频
        pcm, sr = build_melody_wav(i, CHANNEL_ROOT[ch])
        audio_path = os.path.join(audio_dir, f"song_{i:02d}.wav")
        write_wav(audio_path, pcm, sr)
        audio_url = f"/audio/song_{i:02d}.wav"
        # 封面
        cover_path = os.path.join(covers_dir, f"cover_{i:02d}.svg")
        with open(cover_path, "w", encoding="utf-8") as f:
            f.write(cover_svg(title, artist, c1, c2))
        cover_url = f"/img/covers/cover_{i:02d}.svg"
        # 歌词
        lyric = LYRICS.get(title, "[00:00.00]" + title)
        lyrics_by_title[title] = lyric

        songs_by_channel[ch].append({
            "title": title,
            "artist": artist,
            "album": CHANNEL_NAMES[ch],
            "picture": cover_url,
            "url": audio_url,
            "length": int(len(pcm) / 2 / sr),
        })

    # 百家配图 + 正文
    baijia_list = []
    baijia_content = {}
    for art in BAIJIA:
        c1, c2 = ("#2b8a3e", "#18632b")  # 百家统一自然绿系
        svg_path = os.path.join(baijia_dir, f"bj{art['ID']}.svg")
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(baijia_svg(art["theme"], art["m_title"], c1, c2))
        img_url = f"/img/baijia/bj{art['ID']}.svg"
        baijia_list.append({
            "ID": art["ID"],
            "m_title": art["m_title"],
            "m_summary": art["m_summary"],
            "m_image_url": img_url,
        })
        body_html = "".join(
            f'<p style="padding:12px 16px;line-height:1.9;color:#333;font-size:17px;margin:0;">{xml_escape(p)}</p>'
            for p in art["body"]
        )
        baijia_content[str(art["ID"])] = f'''
    <div class="bk-detail">
      <img class="lazy-lozd" src="{img_url}" style="width:100%;display:block;margin:12px 0;" alt="封面">
      {body_html}
      <p style="padding:0 16px 26px;line-height:1.8;color:#999;font-size:13px;">—— 本文为本地模拟数据，用于演示「乐开心」详情页图文渲染。</p>
    </div>'''

    # 笑话配图
    jokes = []
    for i, (title, theme, text) in enumerate(JOKES, start=1):
        c1, c2 = ("#f59f00", "#e8590c") if i % 2 else ("#1c7ed6", "#1864ab")
        svg_path = os.path.join(jokes_dir, f"jk{i:02d}.svg")
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(joke_svg(theme, title, c1, c2))
        jokes.append({
            "title": title,
            "img": f"/img/jokes/jk{i:02d}.svg",
            "text": text,
        })

    about_html = '''<!DOCTYPE html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
  <title>关于乐开心</title>
  <style>
    body{font-family:PingFang SC,Microsoft YaHei,sans-serif;margin:0;padding:40px 20px;color:#333;background:#fafafa;}
    h1{font-size:24px;} .box{max-width:640px;margin:0 auto;background:#fff;padding:24px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.06);}
    code{background:#f0f0f0;padding:2px 6px;border-radius:4px;}
  </style></head>
  <body><div class="box">
    <h1>关于「乐开心」</h1>
    <p>这是一个基于 DCloud MUI 开发的音乐笑话小应用。</p>
    <p>当前由本地开发服务 <code>server.js</code> 提供<b>真实模拟数据</b>与静态托管：歌曲为本地合成可播放旋律，百家与笑话均带真实配图与正文，后端接口前缀为 <code>/app_backend/</code>。</p>
    <p>原远程后端 <code>www.80shihua.com/app_backend</code> 已失效，本仓库已重构为可在本地浏览器直接运行。</p>
  </div></body></html>'''

    data = {
        "channels": {k: {"name": CHANNEL_NAMES[k]} for k in CHANNEL_NAMES},
        "songs_by_channel": songs_by_channel,
        "lyrics_by_title": lyrics_by_title,
        "baijia": baijia_list,
        "baijia_content": baijia_content,
        "jokes": jokes,
        "about": about_html,
    }
    with open(os.path.join(mock_dir, "data.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("生成完成：")
    print("  音频 :", len(SONGS_ORDER), "首 ->", audio_dir)
    print("  封面 :", len(SONGS_ORDER), "张 ->", covers_dir)
    print("  百家图:", len(BAIJIA), "张 ->", baijia_dir)
    print("  笑话图:", len(JOKES), "张 ->", jokes_dir)
    print("  数据 : mock/data.json")


if __name__ == "__main__":
    main()
