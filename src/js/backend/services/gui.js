'use strict';

define(['backend/port', 'darkwallet'],
function(Port, DarkWallet) {
  function GuiService(core) {
    this.name = 'gui';
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
