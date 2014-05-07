'use strict';

define(['backend/port', 'backend/channels/transport', 'backend/channels/catchan', 'darkwallet'],
function(Port, Transport, Channel, DarkWallet) {

  function LobbyService(core) {
    this.lobbyTransport = false;
    var self = this;
    this.name = 'lobby';
    this.core = core;

     // Transport service managing background lobby transport
    Port.listen('lobby',
      function(data) {
         // onMessage
         switch(data.type) {
             case 'initChannel':
               console.log("[lobby] InitChannel", data.name);
               self.lobbyTransport.initChannel(data.name, Channel);
               Port.post('lobby', data);
               break;
       }
      }, function(port) {
         // Ensure the lobby transport is created
         self.getLobbyTransport();
    });

    Port.connect('obelisk', function(data) {
        // WakeUp when connected to obelisk
        if (data.type == 'connected') {
            var network = DarkWallet.getIdentity().wallet.network;
            if (network == 'testnet') {
              self.connectTo('Trolltest');
            } else {
              self.connectTo('Trollbox');
            }
        }
        else if (data.type == 'disconnect' || data.type == 'disconnected') {
            console.log("[lobby] disconnect");
            // obelisk being instructed to disconnect
            if (self.lobbyTransport) {
                self.lobbyTransport.disconnect();
                self.lobbyTransport = false;
            }
            self.channel = null;
        }
    });
  };

  LobbyService.prototype.getLobbyTransport = function() {
    if (!this.lobbyTransport) {
      console.log('[lobby] init lobby transport');
      var identity = this.core.getCurrentIdentity();
      this.lobbyTransport = new Transport(identity, this.core.service.obelisk);
    }
    return this.lobbyTransport;
  };

  LobbyService.prototype.connectTo = function(channel) {
    var self = this;
    console.log("[lobby] Connecting to "+channel+"...");
    var lobbyTransport = this.getLobbyTransport();
    if (!this.channel) {
      this.channel = lobbyTransport.initChannel(channel, Channel);
      this.channel.addCallback('Shout', function(_d) {self.onShout(channel, _d)});
    }
  };
 
  LobbyService.prototype.onShout = function(channel, msg) {
    var identity = DarkWallet.getIdentity();
    var notifier = this.core.service.notifier;
    if (identity.settings.notifications.popup) {
      console.log("[lobby] Received message: " + msg.body.text);
      notifier.post(channel, msg.body.text);
    }
  };

  return LobbyService;

});
