define(['backend/services', 'util/transport', 'util/channels/catchan'],
function(Services, Transport, Channel) {
  'use strict';

  function LobbyService(core) {
    var lobbyTransport;

     // Transport service managing background lobby transport
    Services.start('lobby',
      function(data) {
         // onMessage
         switch(data.type) {
             case 'initChannel':
               lobbyTransport.initChannel(data.name, Channel);
               break;
       }
      }, function(port) {
         // Connected
         console.log('bus: lobby client connected');
         if (!lobbyTransport) {
             console.log('init lobby transport');
             var identity = core.getCurrentIdentity();
             lobbyTransport = new Transport(identity, obeliskClient);
             lobbyTransport.update = function() { Services.post('gui', {'type': 'update'}) };
       }
    });
    this.getLobbyTransport = function() { return lobbyTransport; }
  }

  return LobbyService;

});
