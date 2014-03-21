define(['backend/services', 'darkwallet_gateway'],
function(Services) {
  'use strict';
  function ObeliskService(core) {
      var self = this;
      this.client = null;
      this.connected = false;
      this.connecting = false;
    
      // Background service for communication with the frontend
      Services.start('obelisk', function() {
        }, function(port) {
            // Connected
            console.log('[bus] obelisk client connected');
            var client = self.client;
            if (client && client.connected) {
                port.postMessage({'type': 'connected'});
            }
      }, function() {
          console.log('[bus] obelisk client disconnected');
      });
  }

  ObeliskService.prototype.connect = function(connectUri, handleConnect) {
      if (this.connected || this.connecting) {
          // wait for connection
      } else {
          console.log("[obelisk] Connecting");
          this.connectClient(connectUri, function() {
              console.log("[obelisk] Connected");
              handleConnect ? handleConnect : null;
              Services.post('obelisk', {'type': 'connected'});
          });
      }
  }

  ObeliskService.prototype.connectClient = function(connectUri, handleConnect) {
      var self = this;
      this.connecting = true;
      this.client = new GatewayClient(connectUri, function() {
          self.client.connected = true;
          self.connected = true;
          self.connecting = false;
          handleConnect ? handleConnect() : null;
      });
  }

  ObeliskService.prototype.getClient = function() {
    return this.client;
  }

  return ObeliskService;

});
