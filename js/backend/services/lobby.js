define(['backend/port', 'backend/channels/transport', 'backend/channels/catchan'],
function(Port, Transport, Channel) {
  'use strict';

  function LobbyService(core) {
    var lobbyTransport;
    var self = this;
    this.name = 'lobby';

     // Transport service managing background lobby transport
    Port.listen('lobby',
      function(data) {
         // onMessage
         switch(data.type) {
             case 'initChannel':
               console.log("[lobby] InitChannel", data.name);
               lobbyTransport.initChannel(data.name, Channel);
               Port.post('lobby', data);
               break;
       }
      }, function(port) {
         // Ensure the lobby transport is created
         self.getLobbyTransport();
    });

    Port.connect('obelisk', function(data) {
        if (data.type == 'disconnect') {
            console.log("[lobby] disconnect");
            // obelisk being instructed to disconnect
            if (lobbyTransport) {
                lobbyTransport.disconnect();
                lobbyTransport = false;
            }
        }
    });


    this.getLobbyTransport = function() {
      if (!lobbyTransport) {
        console.log('[lobby] init lobby transport');
        var identity = core.getCurrentIdentity();
        lobbyTransport = new Transport(identity, core.service.obelisk);
        lobbyTransport.update = function() { Port.post('gui', {'type': 'update'}); };
      }
      return lobbyTransport;
    };
  }

  return LobbyService;

});
