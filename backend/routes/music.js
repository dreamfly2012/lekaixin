'use strict';

/**
 * 音乐接口（替代已停服的豆瓣 FM）
 * ------------------------------------------------------------------
 * 数据源由 config.USE_MUSIC 决定：
 *   audius  （默认）开源去中心化音乐 Audius，免 key、可直接流式播放。
 *           频道 = 风格（trending / Electronic / Hip-Hop/Rap / Pop / Rock / Ambient）
 *   netease 网易云音乐开源 API（NeteaseCloudMusicApi），中文歌曲可真实播放，
 *           频道 = 网易云歌单/榜单 id，需配置 config.NCM_API。
 *
 * 三个接口：
 *   getchannels.php    -> 返回当前数据源对应的频道列表 [{channel_id, name}]
 *   getmusic.php?id=   -> 返回 {song:[{title,artist,album,picture,url,length}]}
 *   getlrc.php /
 *   getlrc_content.php -> 歌词（暂用本地 mock 兜底）
 *
 * 远端拉取失败时逐层回退：netease -> audius -> 本地 mock。
 */
const config = require('../config');
const mock = require('../mock');
const { getCurl } = require('../http');
const { sendJSON, sendText } = require('../reply');

const AUDIUS_HOST = 'https://discoveryprovider.audius.co';

// 频道定义：按 USE_MUSIC 返回不同频道
function getChannels() {
  if (config.USE_MUSIC === 'netease') {
    return [
      { channel_id: '19723756', name: '飙升榜' },
      { channel_id: '3778678', name: '热歌榜' },
      { channel_id: '3779629', name: '新歌榜' },
      { channel_id: '2884035', name: '原创榜' },
      { channel_id: '71384707', name: '经典老歌' }
    ];
  }
  // 默认 audius：按风格分频道
  return [
    { channel_id: 'trending', name: '推荐' },
    { channel_id: 'Electronic', name: '电子' },
    { channel_id: 'Hip-Hop/Rap', name: '嘻哈' },
    { channel_id: 'Pop', name: '流行' },
    { channel_id: 'Rock', name: '摇滚' },
    { channel_id: 'Ambient', name: '氛围' }
  ];
}

function getChannelsRoute(req, res) {
  return sendJSON(res, getChannels());
}

// 取封面：优先 480x480，回退其它尺寸
function pickArtwork(art) {
  if (!art) return '';
  return art['480x480'] || art['1000x1000'] || art['150x150'] || '';
}

// ---------- Audius ----------
async function getMusicAudius(channel) {
  const genre = channel && channel !== 'trending' ? '&genre=' + encodeURIComponent(channel) : '';
  const url = AUDIUS_HOST + '/v1/tracks/trending?app_name=' +
    encodeURIComponent(config.AUDIUS_APP) + genre + '&limit=30';
  const text = await getCurl(url);
  const info = JSON.parse(text);
  const list = (info && info.data) || [];
  return list.map(t => ({
    title: t.title || '',
    artist: (t.user && t.user.name) || '',
    album: (t.album && t.album.title) || '',
    picture: pickArtwork(t.artwork),
    url: AUDIUS_HOST + '/v1/tracks/' + t.id + '/stream?app_name=' + encodeURIComponent(config.AUDIUS_APP),
    length: Number(t.duration) || 0
  }));
}

// ---------- 网易云音乐 ----------
async function getMusicNetease(channel) {
  const base = config.NCM_API.replace(/\/$/, '');
  const detail = JSON.parse(await getCurl(base + '/playlist/detail?id=' + encodeURIComponent(channel)));
  const tracks = (detail && detail.playlist && detail.playlist.tracks) || [];
  const ids = tracks.map(t => t.id).join(',');
  const urlMap = {};
  try {
    const urlinfo = JSON.parse(await getCurl(base + '/song/url?id=' + ids));
    (urlinfo.data || []).forEach(u => { if (u.url) urlMap[u.id] = u.url; });
  } catch (e) {
    console.warn('[music] 网易云取播放地址失败:', e.message);
  }
  return tracks
    .map(t => {
      const ar = (t.artists && t.artists[0] && t.artists[0].name) || '';
      const al = (t.album && t.album.name) || '';
      const pic = (t.album && t.album.picUrl) || '';
      return {
        title: t.name || '',
        artist: ar,
        album: al,
        picture: pic,
        url: urlMap[t.id] || '',
        length: Math.round((t.duration || 0) / 1000)
      };
    })
    .filter(s => s.url);
}

async function getMusic(req, res, query) {
  const channel = query.id || 'trending';
  try {
    if (config.USE_MUSIC === 'netease') {
      try {
        const songs = await getMusicNetease(channel);
        if (songs.length) return sendJSON(res, { song: songs });
      } catch (e) {
        console.warn('[music] 网易云失败，尝试 Audius:', e.message);
      }
      // 网易云取不到 -> 回退 Audius
      const s2 = await getMusicAudius(channel);
      if (s2.length) return sendJSON(res, { song: s2 });
    } else {
      const songs = await getMusicAudius(channel);
      if (songs.length) return sendJSON(res, { song: songs });
    }
  } catch (e) {
    console.warn('[music] 远端失败，回退本地:', e.message);
  }
  // 最终回退到本地 mock（保持旧结构 {song:[...]}）
  const m = mock.getMusic(channel === 'trending' ? 1 : channel);
  return sendJSON(res, m);
}

// 歌词：当前无稳定开源歌词源，统一用本地 mock 兜底
function getLrc(req, res, query) {
  return sendJSON(res, mock.getLyric(query.song || ''));
}
function getLrcContent(req, res, query) {
  return sendText(res, mock.getLyricContent(query.url || ''), 'text/plain');
}

module.exports = { getChannels, getChannelsRoute, getMusic, getLrc, getLrcContent };
