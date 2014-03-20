define(['backend/services', 'backend/transport', 'backend/channels/catchan'],
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
               Services.post('lobby', data)
               break;
       }
      }, function(port) {
         // Connected
         console.log('bus: lobby client connected');
         if (!lobbyTransport) {
             console.log('init lobby transport');
             var identity = core.getCurrentIdentity();
             lobbyTransport = new Transport(identity, core.getObeliskClient());
             lobbyTransport.update = function() { Services.post('gui', {'type': 'update'}) };
       }
    });
    this.getLobbyTransport = function() { return lobbyTransport; }
  }

  return LobbyService;

});
