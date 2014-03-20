define(['backend/services'],
function(Services) {
  'use strict';
  function GuiService(core) {
    // Gui service
    Services.start('gui', function() {
      }, function(port) {
          // onMessage
          console.log('bus: gui client connected');
          port.postMessage({type: 'note', text: 'gui client connected'})
      }, function(port) {
          // Connected
          console.log('bus: gui client disconnected');
    });
  }

  return GuiService;

});
