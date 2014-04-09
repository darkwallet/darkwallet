define(function() {
  var SoundUtils = {

    play: function(sound) {
      var audio = document.createElement('audio');
      audio.setAttribute('autoplay', 'autoplay');
      audio.innerHTML = '<source src="../sound/' + sound + '.opus" type="audio/ogg" />';
      document.getElementById('fixed').appendChild(audio);
    },
    
    registerScope: function(scope) {
      scope.playSound = SoundUtils.play;
    }
  };
  return SoundUtils;
});
