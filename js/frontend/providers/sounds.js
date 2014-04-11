define(['./module'], function (providers) {
  'use strict';

  providers.factory('sounds', function() {
    return {
      play: function(sound) {
        var audio = document.createElement('audio');
        audio.setAttribute('autoplay', 'autoplay');
        audio.innerHTML = '<source src="../sound/' + sound + '.opus" type="audio/ogg" />';
        document.getElementById('fixed').appendChild(audio);
      },
    };
  });
});