/**
 * 乐开心 · 音乐播放器引擎
 * ------------------------------------------------------------------
 * jQuery 插件：$("#myAudio").initAudio()
 *
 * 约定（由页面保证）：
 *   #myAudio 容器内包含 <audio preload="metadata"> 及若干
 *   <source title="艺人 - 歌名" src="..." data-length="秒" data-cover="封面URL" />
 *
 * 能力：
 *   - 生成播放器 UI（黑胶唱片 / 进度条 / 控制按钮 / 音量 / 播放列表）
 *   - 播放、暂停、上一首、下一首（自动接歌）
 *   - 进度条：rAF 平滑跟随 + timeupdate 双保险，支持按住拖拽 seek
 *   - 歌词同步：window.LK_LYRIC_SYNC(curTime)，歌词数据由页面写入 window.LK_LYRIC
 *   - 切歌事件：document 上派发 'lk:songchange'，页面监听后刷新歌词
 *
 * 对外 API（挂在 audio 元素上）：
 *   audio.lkPlayer = { playIndex, next, prev, toggle, index, titleAt }
 *
 * 事件全部使用 .ap 命名空间，避免与页面自身绑定的 timeupdate 等互相解绑。
 */
(function ($) {
	'use strict';

	/* ------------------------------ 工具 ------------------------------ */
	function pad(n) { return n < 10 ? '0' + n : '' + n; }
	function formatTime(t) {
		if (!isFinite(t) || t < 0) t = 0;
		var m = Math.floor(t / 60), s = Math.floor(t % 60);
		return m + ':' + pad(s);
	}
	function esc(s) {
		return String(s == null ? '' : s)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}
	// "艺人 - 歌名" -> { artist, title }
	function splitTitle(full) {
		full = String(full || '');
		var sep = full.indexOf(' - ');
		if (sep > 0) return { artist: full.slice(0, sep), title: full.slice(sep + 3) };
		return { artist: '', title: full };
	}
	function pctOf(clientX, el) {
		var r = el.getBoundingClientRect();
		if (!r.width) return 0;
		return Math.max(0, Math.min(100, (clientX - r.left) / r.width * 100));
	}

	/* ------------------------------ 图标 ------------------------------ */
	var SVG = {
		play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>',
		pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7a.6.6 0 0 1-.6-.6V5.6A.6.6 0 0 1 7 5zM13.6 5H17a.6.6 0 0 1 .6.6v12.8a.6.6 0 0 1-.6.6h-3.4z"/></svg>',
		prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2.2v12H6a.6.6 0 0 1-.6-.6V6.6A.6.6 0 0 1 6 6zM9.4 12l9.2-5.8v11.6z"/></svg>',
		next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.8 6H18a.6.6 0 0 1 .6.6v10.8a.6.6 0 0 1-.6.6h-2.2zM14.6 12L5.4 6.2v11.6z"/></svg>',
		back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 5.3 8 12l6.7 6.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
		list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v2.2H4zM4 10.9h16v2.2H4zM4 16.3h9.2v2.2H4z"/></svg>',
		vol: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.4v5.2h3.2L12 18.7V5.3L7.2 9.4H4z"/><path d="M15.2 9.2a4 4 0 0 1 0 5.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M17.6 7a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
		note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>'
	};

	/* --------------------- 歌词同步（全局单例） --------------------- */
	var lyricIdx = -2; // -2 = 脏数据，强制重算
	window.LK_LYRIC_SYNC = function (curTime) {
		var $ul = $('.music_lrc');
		if (!$ul.length) return;
		var $lis = $ul.children('li');
		if (!$lis.length) return;
		var lyric = window.LK_LYRIC || [];
		var idx = -1;
		for (var i = 0; i < lyric.length; i++) {
			if (curTime >= lyric[i][0]) idx = i; else break;
		}
		if (idx === lyricIdx) return;
		lyricIdx = idx;
		var lh = $lis.eq(0).outerHeight() || 26;
		var boxH = $ul.parent().height() || 78;
		var offset = boxH / 2 - (idx * lh + lh / 2);
		if (idx < 0) offset = 0;
		$ul.css('transform', 'translateY(' + offset + 'px)');
		$lis.removeClass('active');
		if (idx >= 0) $lis.eq(idx).addClass('active');
	};
	window.LK_LYRIC_RESET = function () { lyricIdx = -2; };

	/* ------------------------------ 插件 ------------------------------ */
	jQuery.fn.extend({
		initAudio: function () {
			return this.each(function () {
				var $box = $(this);              // #myAudio
				var myAudio = $('audio', $box)[0];
				if (!myAudio) return;
				if (myAudio.lkReady) return;     // 防止重复初始化
				myAudio.lkReady = true;

				var currentSrcIndex = 0;
				var rafId = null;
				var isSeeking = false;
				var seekPct = 0;
				var channelName = window.LK_CHANNEL_NAME || '';

				function $sources() { return $('source', $box); }

				/* ---------- 生成 UI ---------- */
				var inlineMode = !!document.getElementById('radio-player-view');
				$box.append(
					'<div class="lk-bg"></div>' +
					'<div class="lk-veil"></div>' +
					'<div class="lk-ui">' +
						'<div class="lk-top">' +
							'<button type="button" class="lk-icon-btn lk-back" id="radio-back-list" aria-label="返回">' + SVG.back + '</button>' +
							'<div class="lk-top-title">电台<span class="lk-top-sub">正在播放</span></div>' +
							'<button type="button" class="lk-icon-btn lk-toggle-list" aria-label="播放列表">' + SVG.list + '</button>' +
						'</div>' +
						'<div class="lk-stage">' +
							'<div class="lk-disc"><span class="lk-disc-note">' + SVG.note + '</span><img class="lk-cover" alt="封面" /></div>' +
							'<div class="lk-meta">' +
								'<div class="lk-title">未知歌曲</div>' +
								'<div class="lk-artist"></div>' +
							'</div>' +
							'<div class="lk-lyric"><ul class="music_lrc"></ul></div>' +
						'</div>' +
						'<div class="lk-progress">' +
							'<span class="lk-time passed_time">0:00</span>' +
							'<div class="lk-bar"><div class="lk-track"><div class="lk-fill"></div><div class="lk-thumb"></div></div></div>' +
							'<span class="lk-time total_time">0:00</span>' +
						'</div>' +
						'<div class="lk-controls">' +
							'<button type="button" class="lk-ctl btn_previous" aria-label="上一首">' + SVG.prev + '</button>' +
							'<button type="button" class="lk-ctl lk-ctl-play btn_play" aria-label="播放">' + SVG.play + '</button>' +
							'<button type="button" class="lk-ctl btn_next" aria-label="下一首">' + SVG.next + '</button>' +
						'</div>' +
						'<div class="lk-volume">' +
							'<span class="lk-vol-icon">' + SVG.vol + '</span>' +
							'<div class="lk-vol-bar"><div class="lk-track"><div class="lk-fill"></div><div class="lk-thumb"></div></div></div>' +
						'</div>' +
						'<div class="lk-list-wrap">' +
							'<div class="lk-list-head"><span>播放列表</span><span class="lk-list-count">0 首</span></div>' +
							'<ul class="music_list"></ul>' +
						'</div>' +
					'</div>'
				);

				var $bg = $box.find('.lk-bg'),
					$cover = $box.find('.lk-cover'),
					$title = $box.find('.lk-title'),
					$artist = $box.find('.lk-artist'),
					$topSub = $box.find('.lk-top-sub'),
					$count = $box.find('.lk-list-count'),
					$lists = $box.find('.music_list'),
					$playBtn = $box.find('.btn_play'),
					$bar = $box.find('.lk-bar'),
					$fill = $bar.find('.lk-fill'),
					$thumb = $bar.find('.lk-thumb'),
					$passed = $box.find('.passed_time'),
					$total = $box.find('.total_time'),
					$volBar = $box.find('.lk-vol-bar'),
					$volFill = $volBar.find('.lk-fill'),
					$volThumb = $volBar.find('.lk-thumb');

				if (!inlineMode) $box.find('.lk-back').hide();

				/* ---------- 进度 / 音量渲染 ---------- */
				function renderProgress(cur, dur) {
					if (isSeeking) return;
					if (isFinite(dur) && dur > 0) {
						var pct = Math.max(0, Math.min(100, cur / dur * 100));
						$fill.css('width', pct + '%');
						$thumb.css('left', pct + '%');
					}
					$passed.text(formatTime(cur));
				}
				function renderVolume(v) {
					v = Math.max(0, Math.min(1, v));
					$volFill.css('width', v * 100 + '%');
					$volThumb.css('left', v * 100 + '%');
				}
				function setVolume(v) {
					v = Math.max(0, Math.min(1, v));
					myAudio.volume = v;
					window.LK_VOLUME = v; // 记住音量，切台重建后恢复
					renderVolume(v);
				}

				/* rAF 平滑驱动进度（timeupdate 只有约 4 次/秒，rAF 保证丝滑） */
				function tick() {
					// 元素被移出 DOM（切台重建）时停止循环，避免空转
					if (!myAudio.isConnected || myAudio.paused || myAudio.ended) { rafId = null; return; }
					renderProgress(myAudio.currentTime, myAudio.duration);
					if (window.LK_LYRIC_SYNC) window.LK_LYRIC_SYNC(myAudio.currentTime);
					rafId = requestAnimationFrame(tick);
				}
				function startTick() {
					if (rafId == null) rafId = requestAnimationFrame(tick);
				}
				function stopTick() {
					if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
				}

				/* ---------- 拖拽 seek ---------- */
				function seekPreview(clientX) {
					seekPct = pctOf(clientX, $bar[0]);
					$fill.css('width', seekPct + '%');
					$thumb.css('left', seekPct + '%');
					var dur = myAudio.duration;
					if (isFinite(dur) && dur > 0) $passed.text(formatTime(dur * seekPct / 100));
				}
				function seekCommit() {
					var dur = myAudio.duration;
					if (isFinite(dur) && dur > 0) myAudio.currentTime = dur * seekPct / 100;
				}
				$bar.on('pointerdown.ap', function (e) {
					e.preventDefault();
					isSeeking = true;
					$bar.addClass('seeking');
					try { $bar[0].setPointerCapture(e.pointerId); } catch (_) { }
					seekPreview(e.clientX);
				});
				$bar.on('pointermove.ap', function (e) {
					if (isSeeking) seekPreview(e.clientX);
				});
				$bar.on('pointerup.ap pointercancel.ap', function (e) {
					if (!isSeeking) return;
					isSeeking = false;
					$bar.removeClass('seeking');
					seekCommit();
					renderProgress(myAudio.currentTime, myAudio.duration);
					if (window.LK_LYRIC_SYNC) window.LK_LYRIC_SYNC(myAudio.currentTime);
				});

				/* ---------- 拖拽音量 ---------- */
				var volSeeking = false;
				function volPreview(clientX) {
					var p = pctOf(clientX, $volBar[0]);
					renderVolume(p / 100);
					myAudio.volume = p / 100;
				}
				$volBar.on('pointerdown.ap', function (e) {
					e.preventDefault();
					volSeeking = true;
					try { $volBar[0].setPointerCapture(e.pointerId); } catch (_) { }
					volPreview(e.clientX);
				});
				$volBar.on('pointermove.ap', function (e) {
					if (volSeeking) volPreview(e.clientX);
				});
				$volBar.on('pointerup.ap pointercancel.ap', function () { volSeeking = false; });

				/* ---------- 播放列表 ---------- */
				function initMusicList() {
					var $srcs = $sources(), html = '';
					$srcs.each(function (i) {
						var st = splitTitle($(this).attr('title'));
						html += '<li>' +
							'<span class="lk-li-idx">' + (i + 1) + '</span>' +
							'<span class="lk-li-body">' +
								'<span class="lk-li-title">' + esc(st.title || '未知歌曲') + '</span>' +
								(st.artist ? '<span class="lk-li-artist">' + esc(st.artist) + '</span>' : '') +
							'</span>' +
							'<span class="lk-eq" aria-hidden="true"><i></i><i></i><i></i></span>' +
							'</li>';
					});
					$lists.html(html);
					$count.text($srcs.length + ' 首');
				}

				/* ---------- 当前曲目 UI ---------- */
				function applySongUI(idx) {
					var $srcs = $sources(), $src = $srcs.eq(idx);
					if (!$srcs.length || !$src.length) return;
				currentSrcIndex = idx;
				var st = splitTitle($src.attr('title'));
				$title.text(st.title || '未知歌曲');
				$artist.text(st.artist || '');
				var cover = $src.attr('data-cover') || '';
				if (cover) {
						$cover.attr('src', cover).show();
						$bg.css('background-image', 'url("' + cover + '")');
					} else {
						$cover.hide();
						$bg.css('background-image', 'none');
					}
					$cover.off('error.ap').on('error.ap', function () { $(this).hide(); });
					$topSub.text(channelName ? ('正在播放 · ' + channelName) : '正在播放');
					$lists.each(function () {
						$(this).children().removeClass('active').eq(idx).addClass('active');
					});
					// 切歌重置进度，先用 data-length 兜底显示总时长
					$fill.css('width', '0%');
					$thumb.css('left', '0%');
					$passed.text('0:00');
					var len = parseFloat($src.attr('data-length'));
					$total.text(isFinite(len) && len > 0 ? formatTime(len) : '0:00');
					refreshPlayState();
				}

				function refreshPlayState() {
					var playing = !myAudio.paused && !myAudio.ended;
					$playBtn.html(playing ? SVG.pause : SVG.play).attr('aria-label', playing ? '暂停' : '播放');
					$box.find('.lk-disc').toggleClass('playing', playing);
				}

				/* ---------- 播放控制 ---------- */
				function playIndex(i, autoplay) {
					var $srcs = $sources();
					if (!$srcs.length) return;
					i = Math.max(0, Math.min($srcs.length - 1, i));
					if (i === currentSrcIndex && myAudio.src) {
						// 同一首：暂停中则恢复播放，播放中则不打断
						if (myAudio.paused && autoplay !== false) myAudio.play();
						return;
					}
					currentSrcIndex = i;
					myAudio.src = $srcs.eq(i).prop('src');
					applySongUI(i);
					if (autoplay !== false) myAudio.play();
					$(document).trigger('lk:songchange', [i]);
				}
				function next(auto) {
					var n = $sources().length;
					if (!n) return;
					playIndex((currentSrcIndex + 1) % n, auto !== false);
				}
				function prev() {
					var n = $sources().length;
					if (!n) return;
					playIndex((currentSrcIndex - 1 + n) % n);
				}
				function toggle() {
					if (myAudio.paused) myAudio.play(); else myAudio.pause();
				}

				$playBtn.on('click.ap', toggle);
				$box.find('.btn_next').on('click.ap', function () { next(); });
				$box.find('.btn_previous').on('click.ap', function () { prev(); });
				$box.find('.lk-toggle-list').on('click.ap', function () {
					$box.find('.lk-list-wrap').toggleClass('list-off');
				});
				$box.find('.lk-back').on('click.ap', function () {
					if (typeof window.hideRadioPlayer === 'function') window.hideRadioPlayer();
					else if (window.mui && window.mui.back) window.mui.back();
					else history.back();
				});

				/* ---------- audio 事件（全部 .ap 命名空间） ---------- */
				$(myAudio)
					.on('loadedmetadata.ap', function () {
						var dur = myAudio.duration;
						if (!isFinite(dur) || dur <= 0) {
							var len = parseFloat($sources().eq(currentSrcIndex).attr('data-length'));
							dur = isFinite(len) ? len : 0;
						}
						$total.text(formatTime(dur));
						applySongUI(currentSrcIndex);
					})
					.on('timeupdate.ap', function () {
						renderProgress(this.currentTime, this.duration);
					})
					.on('play.ap', function () {
						refreshPlayState();
						startTick();
					})
					.on('pause.ap', function () {
						refreshPlayState();
						stopTick();
						renderProgress(myAudio.currentTime, myAudio.duration);
					})
					.on('ended.ap', function () {
						stopTick();
						next(true);
					})
					.on('error.ap', function () {
						$title.text('音频加载失败');
					});

				/* ---------- 初始化 ---------- */
				initMusicList();
				applySongUI(currentSrcIndex);
				var initVolume = typeof window.LK_VOLUME === 'number' ? window.LK_VOLUME : 0.7;
				setVolume(initVolume);
				$(myAudio).trigger('loadedmetadata.ap');

				/* ---------- 对外 API ---------- */
				myAudio.lkPlayer = {
					playIndex: playIndex,
					next: next,
					prev: prev,
					toggle: toggle,
					index: function () { return currentSrcIndex; },
					titleAt: function (i) {
						var full = $sources().eq(i).attr('title') || '';
						return splitTitle(full).title;
					}
				};
			});
		}
	});
})(jQuery);
