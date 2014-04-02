define(['backend/services', 'darkwallet'],
function(Services, DarkWallet) {
  'use strict';
  function GuiService(core) {
    // Gui service
    Services.start('gui', function() {
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
