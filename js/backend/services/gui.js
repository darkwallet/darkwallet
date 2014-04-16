define(['backend/port', 'darkwallet'],
function(Port, DarkWallet) {
  'use strict';
  function GuiService(core) {
    // Gui service
    Port.listen('gui', function() {
      }, function(port) {
          // Connected
          //console.log('[bus] gui client connected');
      }, function(port) {
          // Disconnected
          //console.log('[bus] gui client disconnected');
    });
  }

  return GuiService;

});
