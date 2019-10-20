
// Cache references to DOM elements.
var elms = ['loaderBtn', 'selectedChapter', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'volumeBtn', 'progress', 'bar', 'wave', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});
var domlist = [];

var Player = function(playlist) {
  this.playlist = playlist;
  this.index = 0;

  // Setup the playlist display.
  list = document.getElementById("list-song");
  playlist.forEach(function(song) {
    var div = document.createElement('button');
    div.className = 'list-group-item list-group-item-action list-item-style common-list-style';
    div.innerHTML = song.title;
    div.onclick = function() {
      player.skipTo(playlist.indexOf(song));
    };
    domlist.push(div);
    list.appendChild(div);
  });
    var div = document.createElement('button');
    div.className = 'list-group-item list-group-item-action list-item-style disabled common-list-style text-center';
    div.innerHTML = '....';  
    list.appendChild(div);
};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    var self = this;
    var sound;
    index = typeof index === 'number' ? index : self.index;
    var data = self.playlist[index];

    if(ga){
      ga('send', 'event', 'audiobook', 'play', data.title);
    }

    selectedChapter.innerHTML = data.title;

    domlist.forEach((domelm)=>{
      domelm.classList.remove('active');
    })
    domlist[index].classList.add('active');
    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      console.log('data.src', data.src);

      sound = data.howl = new Howl({
        src: [data.src],
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function() {
          playBtn.style.display = 'none';
          pauseBtn.style.display = 'block';
        },
        onload: function() {
          loaderBtn.style.display = 'none';
        },
        onend: function() {
          self.skip('next');
        },
        onpause: function() {
          // Stop the wave animation.
          playBtn.style.display = 'block';
          pauseBtn.style.display = 'none';
        },
        onstop: function() {
          // Stop the wave animation.
          playBtn.style.display = 'block';
          pauseBtn.style.display = 'none';
        }
      });
    }

    // Begin playing the sound.
    sound.play();
    // Show the pause button.
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
      loaderBtn.style.display = 'none';
    } else {
      loaderBtn.style.display = 'block';
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Puase the sound.
    sound.pause();

    // Show the play button.
    playBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    var self = this;

    // Get the next track based on the direction of the track.
    var index = 0;
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    var self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    var barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%';

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function() {
    var self = this;
    var display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      playlist.style.display = display;
    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function() {
    var self = this;
    var display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

var player = new Player([
  {
    title: 'Chapter one',
    src: 'https://generated-audiobook.s3.amazonaws.com/pride-and-prejudice/charpter_0.5a1d284c-33ad-4240-8a99-2a1729344bcb.mp3',
    howl: null
  },
  {
    title: 'Chapter two',
    src: 'https://generated-audiobook.s3.amazonaws.com/pride-and-prejudice/charpter_1.cd31ff41-2230-4c51-9c69-d8d00863a0ff.mp3',
    howl: null
  },
  {
    title: 'Chapter three',
    src: 'https://generated-audiobook.s3.amazonaws.com/pride-and-prejudice/charpter_2.60d5d570-5465-4648-89d6-34a3f236637f.mp3',
    howl: null
  },
  {
    title: 'Chapter four',
    src: 'https://generated-audiobook.s3.amazonaws.com/pride-and-prejudice/charpter_3.9aa1f700-5943-482b-9d75-b73697b54ac9.mp3',
    howl: null
  },
  {
    title: 'Chapter five',
    src: 'https://generated-audiobook.s3.amazonaws.com/pride-and-prejudice/charpter_4.8238a39a-34dc-4102-86aa-e7d49d538e61.mp3',
    howl: null
  },
  {
    title: 'Chapter six',
    src: 'https://generated-audiobook.s3.amazonaws.com/pride-and-prejudice/charpter_5.b32d1291-712a-4d2d-abee-773863e6359e.mp3',
    howl: null
  }
]);

// Bind our player controls.
playBtn.addEventListener('click', function() {
  player.play();
});
pauseBtn.addEventListener('click', function() {
  player.pause();
});
prevBtn.addEventListener('click', function() {
  player.skip('prev');
});
nextBtn.addEventListener('click', function() {
  player.skip('next');
});
