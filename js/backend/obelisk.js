define(['backend/services', 'util/transport', 'util/channels/catchan', 'darkwallet_gateway'],
function(Services, Transport, Channel) {
  'use strict';
  function ObeliskService(core) {
    var self = this;
    this.client = null;
    
    // Background service for communication with the frontend
    Services.start('obelisk', function() {
      }, function(port) {
          // Connected
          console.log('bus: obelisk client connected');
          var client = self.client;
          if (client && client.connected) {
              Services.post('obelisk', {'type': 'connected'});
          }
    });
  }

  ObeliskService.prototype.connect = function(connectUri, handleConnect) {
    this.client = new GatewayClient(connectUri, handleConnect);
  }

  ObeliskService.prototype.getClient = function() {
    return this.client;
  }

  return ObeliskService;

});
