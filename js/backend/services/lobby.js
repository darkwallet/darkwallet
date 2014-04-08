define(['backend/services', 'backend/channels/transport', 'backend/channels/catchan'],
function(Services, Transport, Channel) {
  'use strict';

  function LobbyService(core) {
    var lobbyTransport;
    var self = this;

     // Transport service managing background lobby transport
    Services.start('lobby',
      function(data) {
         // onMessage
         switch(data.type) {
             case 'initChannel':
               lobbyTransport.initChannel(data.name, Channel);
               Services.post('lobby', data)
               break;
       }
      }, function(port) {
         // Connected
         console.log('bus: lobby client connected');

         // Ensure the lobby transport is created
         self.getLobbyTransport();
    });

    this.getLobbyTransport = function() {
      if (!lobbyTransport) {
        console.log('[lobby] init lobby transport');
        var identity = core.getCurrentIdentity();
        lobbyTransport = new Transport(identity, core.getObeliskClient());
        lobbyTransport.update = function() { Services.post('gui', {'type': 'update'}) };
      }
      return lobbyTransport;
    }
  }

  return LobbyService;

});
