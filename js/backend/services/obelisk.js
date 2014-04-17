define(['backend/port', 'darkwallet_gateway'],
function(Port) {
  'use strict';


  /**
   * Obelisk service class
   */
  function ObeliskService(core) {
      var self = this;
      this.client = null;
      this.connected = false;
      this.connecting = false;
    
      // Port for communication with the frontend
      Port.listen('obelisk', function() {
        }, function(port) {
            // Client connected
            var client = self.client;
            if (client && client.connected) {
                port.postMessage({'type': 'connected'});
            } else if (client && client.connecting) {
                port.postMessage({'type': 'connecting'});
            }
      }, function() {
          // Client disconnected
      });
  }


  /**
   * Connect to obelisk
   */
  ObeliskService.prototype.connect = function(connectUri, handleConnect) {
      var self = this;
      if (this.connected || this.connecting) {
          // wait for connection
      } else {
          console.log("[obelisk] Connecting");
          Port.post('obelisk', {'type': 'connecting'});
          self.connecting = true;
          this.connectClient(connectUri, function(err) {
              // Connected
              if (!err) {
                  console.log("[obelisk] Connected");
                  self.connected = true;
              }
              self.connecting = false;
              handleConnect ? handleConnect(err) : null;
              if (err) {
                  console.log("[obelisk] Error connecting");
                  Port.post('obelisk', {'type': 'connectionError', 'error': 'Error connecting'});
              } else {
                  Port.post('obelisk', {'type': 'connected'});
              }
          }, function(err, evt) {
              // Disconnected
              console.log("[obelisk] Disconnected", evt);
              Port.post('obelisk', {'type': 'disconnected'});
              self.connected = false;
          }, function(evt) {
              // Error
              console.log("[obelisk] websocket error", evt);
          });
      }
  };


  /**
   * Disconnect from obelisk
   */
  ObeliskService.prototype.disconnect = function() {
      Port.post('obelisk', {'type': 'disconnect'});
      console.log("[obelisk] Disconnect");
      if (this.client && this.connected) {
          this.connected = false;
          this.client.websocket.close();
          this.client = null;
      }
  };


  /**
   * Start the gateway client
   */
  ObeliskService.prototype.connectClient = function(connectUri, handleConnect, handleDisconnect) {
      this.connecting = true;
      this.client = new GatewayClient(connectUri, handleConnect, handleDisconnect);
  };


  /**
   * Get the gateway client
   */
  ObeliskService.prototype.getClient = function() {
    return this.client;
  };

  return ObeliskService;

});
