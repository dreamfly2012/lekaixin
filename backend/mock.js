'use strict';

/**
 * 读取 mock/data.json，并提供与前端契约一致的 getter。
 * mock/data.json 由 tools/gen_assets.py 生成。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'mock', 'data.json');
let DATA = null;

function load() {
  if (!DATA) {
    DATA = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  }
  return DATA;
}

module.exports = {
  getJokes: () => load().jokes,
  getBaijiaList: () => load().baijia,
  getBaijiaContent: (id) => load().baijia_content[id] || '<p style="padding:16px;">未找到该文章</p>',
  getMusic: (ch) => {
    const d = load();
    const songs = d.songs_by_channel[String(ch)] || d.songs_by_channel['1'];
    return { song: songs };
  },
  // 等价原 getlrc.php：返回 {lrc: 歌名}（前端再用它去取歌词内容）
  getLyric: (song) => ({ lrc: song || '' }),
  getLyricContent: (title) => load().lyrics_by_title[title] || '[00:00.00]暂无歌词',
  getAbout: () => load().about,
  // QQ 部落（前端未使用，给一份空结构兜底）
  getTopic: () => ({ list: [] }),
  getTopicDetail: (tid) => ({ tid, content: '' }),
  // 原始数据（供需要完整结构的模块使用）
  raw: () => load()
};
