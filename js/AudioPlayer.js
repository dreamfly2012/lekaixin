(function($){
	jQuery.fn.extend({
		"initAudio" : function(){
			/*添加播放器UI组件*/
			this.append(
				'<div class="music_info clearfix">'+
					'<div class="meta_data">'+
						'<span class="title"></span>'+
						'<div class="volume_control">'+
							'<a class="decrease">a</a>'+
							'<span class="base_bar">'+
							    
						        '<div class="mui-input-row mui-input-range">'+
						            '<input type="range" id="block-range" value="50" min="0" max="100" >'+
						        '</div>'+
							
							'</span>'+
							'<a class="increase">b</a>'+
						'</div>'+
					'</div>'+
				'</div>'+
				'<div class="music_lrc_wrap"><ul class="music_lrc"></ul></div>'+
				'<div class="controls">'+
					'<div class="time_line">'+
						'<span class="passed_time">0:00</span>'+
						'<span class="base_bar">'+
							'<div class="mui-input-row mui-input-range">'+
					            '<input type="range" id="block-range" value="0" min="0" max="100" >'+
					        '</div>'+
						'</span>'+
						'<span class="total_time">0:00</span>'+
					'</div>'+
					'<div class="play_controls">'+
						'<a class="btn_previous">e</a>'+
						'<a class="btn_play">c</a>'+
						'<a class="btn_next">d</a>'+
					'</div>'+
				'</div>'
			);
			/*全局变量*/
			var myAudio = $("audio",this)[0],
				$volume_bar = $(".volume_control .base_bar"),
				$progress_bar = $(".time_line #block-range"),
				$slider = $(".volume_control #block-range"),
				$passed_time = $(".time_line .passed_time"),
				currentSrcIndex = 0,
				currentSrc = "";

			/*为播放列表添加歌曲信息*/
			initMusicList();
			/*调控音量方法*/
			HTMLAudioElement.prototype.changeVolumeTo = function(volume){
				this.volume = volume;
				$slider.val(volume*100);
			}
			/*为播放器添加事件监听*/
			/*播放、暂停、上一首、下一首功能实现*/
			$(".btn_play").click(function(){
				if (myAudio.paused) {
					myAudio.play();
				} else {
					myAudio.pause();
				}
			});
			$(".btn_next").click(function(){
				var musicsAmount = $("#myAudio source").length;
				++currentSrcIndex > musicsAmount - 1 && (currentSrcIndex = 0);
				currentSrc = $("#myAudio source").eq(currentSrcIndex).prop("src");
				myAudio.src = currentSrc;
				myAudio.play();
			});
			$(".btn_previous").click(function(){
				--currentSrcIndex < 0 && (currentSrcIndex = 0);
				currentSrc = $("#myAudio source").eq(currentSrcIndex).prop("src");
				myAudio.src = currentSrc;
				myAudio.play();
			});
			/*音量调控功能实现*/
			$(".volume_control .decrease").click(function() {
				var volume = myAudio.volume - 0.1;
				volume < 0 && (volume = 0);
				myAudio.changeVolumeTo(volume);
			});
			$(".volume_control .increase").click(function() {
				var volume = myAudio.volume + 0.1;
				volume > 1 && (volume = 1);
				myAudio.changeVolumeTo(volume);
			});
			$(".volume_control input[type=range]").change(function(ev){
				volume = $(this).val();
				myAudio.changeVolumeTo(volume/100);
			});
			
			/*音频进度条调控功能实现*/
			$(".time_line input[type=range]").change(function(ev){
				volume = $(this).val();
				myAudio.currentTime = myAudio.duration * volume / 100;
			});
			
			 /*audio元素事件绑定*/
			$(myAudio).bind("loadedmetadata",function(){
				var totalTime = formatTime(myAudio.duration);
				var title = $("#myAudio source").eq(currentSrcIndex).attr("title");
				$(".time_line .total_time").text(totalTime);
				$(".meta_data .title").text(title);
			});
			$(myAudio).bind("timeupdate",function(){
				var duration = this.duration;
				var curTime = this.currentTime;
				var percentage = curTime/duration * 100;
				$('.time_line input[type=range]').val(percentage);
				
				var passedTime = formatTime(curTime);
				$passed_time.text(passedTime);						
			});
			$(myAudio).bind("play",function(){
				$(".btn_play").text("h");
				$(".music_list li").eq(currentSrcIndex).addClass("active").siblings().removeClass("active");
				$(".music_info .cd").addClass("rotate");
				$(".cd_holder .stick").addClass("play");
			});
			$(myAudio).bind("pause",function(){
				$(".btn_play").text("c");
				$(".music_info .cd").removeClass("rotate");
				$(".cd_holder .stick").removeClass("play");
			});
			$(myAudio).bind("ended",function(){
				$(".btn_next").triggerHandler("click");
			});
			$(myAudio).bind("progress",function(){
				if (myAudio.buffered.length == 1) {
				  // only one range
				  if (myAudio.buffered.start(0) == 0) {
				    // The one range starts at the beginning and ends at
				    // the end of the video, so the whole thing is loaded
				    var buffered = myAudio.buffered.end(0);
				    var percentage = buffered/myAudio.duration * 100;
				    $(".time_line .base_bar").css("background-size",percentage + "% 100%");
				  }
				}
				
			});
			$(myAudio).trigger("loadedmetadata");
			/*歌曲播放时间的格式化，将秒数格式化为“分:秒”的形式*/
			function formatTime(time) {
				var minutes = parseInt(time/60);
				var seconds = parseInt(time%60);
				seconds<10 && (seconds = "0" + seconds);
				return minutes + ":" + seconds;
			};
			/*拖拽歌曲到播放器功能实现*/
			var $dropbox = $("#myAudio");
			
			$dropbox.bind("dragenter",dragenter = function(e) {
				e.stopPropagation();
				e.preventDefault();
			});
			$dropbox.bind("dragover",dragover = function(e) {
				e.stopPropagation();
				e.preventDefault();
			});
			$dropbox.bind("drop",drop = function(e) {
				e.stopPropagation();
				e.preventDefault();

				var dt = e.originalEvent.dataTransfer;
				var files = dt.files;

				handleFiles(files);
			});
	
			function handleFiles(files) {
				var sources = "";
        		var len = files.length;
				var url;
				for (var i = 0; i < len; i++) {
					url = createObjectURL(files[i]);
					sources = "<source title='" + files[i].name + "' src='" + url + "'>" + sources;
				}
				$(myAudio).append(sources);
				initMusicList();
				
			}

			function createObjectURL(file) {
				if (window.URL) {
					return window.URL.createObjectURL(file);
				} else if (window.webkitURL) {
					return window.webkit.createObjectURL(file);
				} else {
					return null;
				}
			}
			function revokeObjectURL(url) {
				if (window.URL) {
					window.URL.revokeObjectURL(url);
				} else if (window.webkitURL) {
					window.webkitURL.revokeObjectURL(url);
				}
			}

			function initMusicList() {
				var musics = "";
				var $sourceList = $("#myAudio source");
				for (var i = $sourceList.length - 1; i>=0; i--) {
					musics = "<li>" + $sourceList[i].title + "</li>" + musics;
				}
				$(".music_list").html(musics);
			}
		}
	});
})(jQuery)
