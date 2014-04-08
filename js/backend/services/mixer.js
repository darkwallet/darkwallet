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
        self.checkMixing(data);
      }

    });
  }

  /*
   * React to a new obelisk connection
   */
  MixerService.prototype.checkMixing = function() {
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
    } else {
      this.stopMixing();
    }
  }

  /*
   * Initialize the mixer connection
   */
  MixerService.prototype.ensureMixing = function() {
    console.log("[mixer] Check mixing...");
    var lobbyTransport = this.core.getLobbyTransport();
    if (!this.channel) {
      this.channel = lobbyTransport.initChannel('CoinJoin', Channel);
      this.channel.addCallback('lobby', self.onLobbyMessage);
    }
  }

  /*
   * Stop mixing
   */
  MixerService.prototype.stopMixing = function() {
    console.log("[mixer] Stop mixing...");
    if (this.channel) {
      var lobbyTransport = this.core.getLobbyTransport();
      lobbyTransport.closeChannel(this.channel.name);
      this.channel = null;
    }
  }

  /*
   * Lobby message arrived
   */
  MixerService.prototype.onLobbyMessage = function(data) {
  }

  return MixerService;

});
