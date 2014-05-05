'use strict';

define(['backend/port', 'darkwallet_gateway'],
function(Port) {


  /**
   * Obelisk service class
   */
  function ObeliskService(core) {
      var self = this;
      this.name = 'obelisk';
      this.core = core;
      this.client = null;
      this.connected = false;
      this.connecting = false;
      this.reconnectTimeout;
    
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
          this.connecting = true;
          this.connectClient(connectUri, function(err) {
              // Connected
              if (!err) {
                  console.log("[obelisk] Connected");
                  self.connected = true;
              }
              handleConnect ? handleConnect(err) : null;
              if (err) {
                  console.log("[obelisk] Error connecting");
                  Port.post('obelisk', {'type': 'connectionError', 'error': 'Error connecting'});
              } else {
                  Port.post('obelisk', {'type': 'connected'});
              }
          }, function(err, evt) {
              // Disconnected
              self.core.servicesStatus.obelisk = 'offline';
              self.core.servicesStatus.gateway = 'offline';
              console.log("[obelisk] Disconnected");
              Port.post('obelisk', {'type': 'disconnected'});
              if (self.connecting) {
                  self.reconnectTimeout = setTimeout(function() {
                      self.reconnectTimeout = false;
                      self.connect(connectUri, handleConnect);
                  }, 10000);
              }
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
      this.core.servicesStatus.gateway = 'offline';
      this.core.servicesStatus.obelisk = 'offline';
      if (this.client && (this.connected || this.connecting)) {
          if (this.reconnectTimeout) {
              clearTimeout(this.reconnectTimeout);
              this.reconnectTimeout = false;
          }
          this.connected = false;
          this.connecting = false;
          this.client.websocket.close();
          this.client = null;
      }
  };


  /**
   * Start the gateway client
   */
  ObeliskService.prototype.connectClient = function(connectUri, handleConnect, handleDisconnect, handleError) {
      this.connecting = true;
      this.client = new GatewayClient(connectUri, handleConnect, handleDisconnect, handleError);
  };


  /**
   * Get the gateway client
   */
  ObeliskService.prototype.getClient = function() {
    return this.client;
  };

  return ObeliskService;

});
