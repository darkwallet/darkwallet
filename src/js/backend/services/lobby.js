'use strict';

define(['backend/port', 'backend/channels/transport', 'darkwallet'],
function(Port, Transport, DarkWallet) {

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
               self.connectTo(data.name);
               Port.post('lobby', data);
               Port.post('channel', data);
               break;
       }
      }, function(port) {
         // Ensure the lobby transport is created
         self.getLobbyTransport();
    });
    Port.listen('contacts');
    Port.listen('channel');

    Port.connect('obelisk', function(data) {
        // WakeUp when connected to obelisk
        if (data.type == 'connected') {
            var network = DarkWallet.getIdentity().wallet.network;
            var channelName;
            if (network == 'testnet') {
              channelName = 'Trollnet';
            } else {
              channelName = 'Trollbox';
            }
            self.connectTo(channelName);
            var eventData = {type: 'initChannel', name: channelName}
            Port.post('lobby', eventData);
            Port.post('channel', eventData);
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
      this.lobbyTransport = new Transport(identity, this.core.service.obelisk, this.core.service.crypto);
    }
    return this.lobbyTransport;
  };

  LobbyService.prototype.connectTo = function(channel) {
    var self = this;
    var ch = this.getLobbyTransport().initChannel(channel);
    console.log("[lobby] Connecting to "+channel+"...");
    ch.addCallback('Shout', function(_d) {self.onShout(channel, _d)});
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
