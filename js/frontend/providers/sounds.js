'use strict';

define(['./module'], function (providers) {

  providers.factory('sounds', ['$window', function($window) {
    return {
      play: function(sound) {
        var audio = $window.document.createElement('audio');
        audio.setAttribute('autoplay', 'autoplay');
        audio.innerHTML = '<source src="../sound/' + sound + '.opus" type="audio/ogg" />';
        $window.document.getElementById('fixed').appendChild(audio);
      }
    };
  }]);
});