define(['backend/services', 'backend/channels/catchan'],
function(Services, Channel) {
  'use strict';

  /*
   * Service managing mixing.
   * @constructor
   */
  function MixerService(core) {
    var self = this;
    this.core = core;

    // Port for communication with other services
    Services.connect('obelisk', function(data) {
      // WakeUp when connected to obelisk
      if (data.type == 'connected') {
        self.onConnect(data);
      }

    });
  }

  /*
   * React to a new obelisk connection
   */
  MixerService.prototype.onConnect = function() {
    var client = this.core.getClient();
    var identity = this.core.getCurrentIdentity();

    // Check to see we have anything to mix
    var anyMixing = false;
    identity.wallet.pockets.forEach(function(pocket) {
      if (pocket.mixing) {
        anyMixing = true;
      }
    });

    // If any is mixing make sure we are connected
    if (anyMixing) {
      this.ensureMixing();
    }
  }

  /*
   * Initialize the mixer connection
   */
  MixerService.prototype.ensureMixing = function() {
    console.log("[mixer] Connect...");
    var lobbyTransport = this.core.getLobbyTransport();
    var channel = lobbyTransport.initChannel('CoinJoin', Channel);
    channel.addCallback('lobby', function(data) { self.onLobbyMessage(data); })
  }

  /*
   * Lobby message arrived
   */
  MixerService.prototype.onLobbyMessage = function(data) {
  }

  return MixerService;

});
