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
      this.client = new GatewayClient();
      this.connected = false;
      this.shouldConnect = false;
      this.connecting = false;
      this.reconnectTimeout;

      // Port for communication with the frontend
      Port.listen('obelisk', function() {
        }, function(port) {
            // Client connected
            var client = self.client;
            if (client.connected) {
                port.postMessage({'type': 'connected'});
            } else if (client.connecting) {
                port.postMessage({'type': 'connecting'});
            }
      }, function() {
          // Client disconnected
      });
  }


  /**
   * Connect to obelisk
   */
  ObeliskService.prototype.connect = function(connectUri, handleConnect, quiet) {
      var self = this;
      var retryConnect = function() {
        if (!self.reconnectTimeout) {
          self.reconnectTimeout = setTimeout(function() {
              self.reconnectTimeout = false;
              self.connect(connectUri, handleConnect, true);
          }, 10000);
        }
      }
      if (this.connected || this.connecting) {
          // wait for connection
      } else {
          console.log("[obelisk] Connecting");
          Port.post('obelisk', {'type': 'connecting'});
          this.shouldConnect = true;
          this.connecting = true;
          this.connectClient(connectUri, function(err) {
              // Connected
              self.connecting = false;
              if (!err) {
                  console.log("[obelisk] Connected");
                  self.connected = true;
              }
              handleConnect ? handleConnect(err) : null;
              if (err) {
                  console.log("[obelisk] Error connecting");
                  if (!quiet) {
                    Port.post('obelisk', {'type': 'connectionError', 'error': 'Error connecting'});
                  }
                  if (self.shouldConnect) {
                      retryConnect();
                  }
              } else {
                  Port.post('obelisk', {'type': 'connected'});
              }
          }, function(err, evt) {
              // Disconnected
              self.core.servicesStatus.obelisk = 'offline';
              self.core.servicesStatus.gateway = 'offline';
              console.log("[obelisk] Disconnected");
              Port.post('obelisk', {'type': 'disconnected'});
              if (self.shouldConnect && !self.connecting) {
                  retryConnect();
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
  ObeliskService.prototype.disconnect = function(cb) {
      Port.post('obelisk', {'type': 'disconnect'});
      console.log("[obelisk] Disconnect");
      this.core.servicesStatus.gateway = 'offline';
      this.core.servicesStatus.obelisk = 'offline';
      this.shouldConnect = false;
      if (this.connected || this.connecting) {
          if (this.reconnectTimeout) {
              clearTimeout(this.reconnectTimeout);
              this.reconnectTimeout = false;
          }
          this.connected = false;
          this.connecting = false;
          this.client.close(cb);
      } else {
          cb ? cb() : null;
      }

  };


  /**
   * Start the gateway client
   */
  ObeliskService.prototype.connectClient = function(connectUri, handleConnect, handleDisconnect, handleError) {
      this.connecting = true;
      this.client.connect(connectUri, handleConnect, handleDisconnect, handleError);
  };


  /**
   * Get the gateway client
   */
  ObeliskService.prototype.getClient = function() {
    return this.client;
  };

  return ObeliskService;

});
