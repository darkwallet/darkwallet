define(['backend/services', 'backend/channels/catchan', 'util/protocol'],
function(Services, Channel, Protocol) {
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
        // resume tasks
        self.resumeTasks();
      }

    });
  }

  /*
   * React to a new obelisk connection
   */
  MixerService.prototype.checkMixing = function() {
    var identity = this.core.getCurrentIdentity();

    // Check to see we have anything to mix
    var anyMixing = false;
    identity.wallet.pockets.forEach(function(pocket) {
      if (pocket.mixing) {
        anyMixing = true;
      }
    });

    // If we have active tasks should also connect
    anyMixing = anyMixing || this.pendingTasks();

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
    var self = this;
    console.log("[mixer] Check mixing...");
    var lobbyTransport = this.core.getLobbyTransport();
    if (!this.channel) {
      this.channel = lobbyTransport.initChannel('CoinJoin', Channel);
      this.channel.addCallback('CoinJoinOpen', function(_d) {self.onCoinJoinOpen(_d)});
      this.channel.addCallback('CoinJoin', function(_d) {self.onCoinJoin(_d)});
      this.channel.addCallback('CoinJoinFinish', function(_d) {self.onCoinJoinFinish(_d)});
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

  // Tasks

  /*
   * Start a task either internally or by external command
   */
  MixerService.prototype.startTask = function(task) {
    // Make sure the mixer is enabled
    this.ensureMixing();

    // Now do stuff with the task...
    switch(task.state) {
      case 'announce':
        var msg = Protocol.CoinJoinOpenMsg(task.total);
        console.log("[mixer] Announce join");
        this.channel.postEncrypted(msg, function(err, data) {
          if (err) {
            console.log("[mixer] Error announcing join!");
          } else {
            console.log("[mixer] Join announced!");
          }
        });
        break;
      case 'paired':
      case 'finish':
      default:
        console.log('[mixer] start Task!', task.state, task);
        console.log();
        break;
    }
  }

  /*
   * Count the number of pending tasks
   */
  MixerService.prototype.pendingTasks = function() {
    var identity = this.core.getCurrentIdentity();
    console.log('[mixer] check Tasks!', identity);

    if (identity.tasks.tasks['mixer']) {
      return identity.tasks.tasks['mixer'].length;
    }
    return false;
  }

  /*
   * Resume available (pending) tasks
   */
  MixerService.prototype.resumeTasks = function() {
    var self = this;
    var identity = this.core.getCurrentIdentity();

    if (!identity.tasks.tasks.hasOwnProperty('mixer')) {
      return;
    }
    identity.tasks.tasks['mixer'].forEach(function(task) {
      self.startTask(task);
    });
  }

  /*
   * Evaluate a coinjoin opening and respond if appropriate.
   */
  MixerService.prototype.evaluateOpening = function(peer, opening) {
    var shouldPair = false;

    // Evaluate mixing pockets to see if we can pair

    // If we resulted in pairing, continue with protocol.
    if (shouldPair) {
      var msg = Protocol.CoinJoinMsg("deadbeef");

      // Post using end to end channel capabilities
      this.channel.postDH(peer.pubKey, msg, function(err, data) {
        // Pairing message sent successfully
      });
    }
  }

  /*
   * Process a message for an ongoing CoinJoin
   */
  MixerService.prototype.processCoinJoin = function(peer, opening) {
  }

  /*
   * Process a message finishing a coinjoin conversation
   */
  MixerService.prototype.processFinish = function(peer, opening) {
  }

  /*
   * Protocol messages arriving
   */
  MixerService.prototype.onCoinJoinOpen = function(msg) {
    if (!msg.peer) {
      console.log("[mixer] Peer not found " + msg.sender);
      return;
    }
    if (msg.sender != this.channel.fingerprint) {
      console.log("[mixer] CoinJoinOpen", msg.peer);
      this.evaluateOpening(msg.peer, msg);
    } else {
      console.log("[mixer] My CoinJoinOpen is back", msg);
    }
  }
  MixerService.prototype.onCoinJoin = function(msg) {
    if (msg.sender != this.channel.fingerprint) {
      console.log("[mixer] CoinJoin", msg);
      this.processCoinJoin(msg.peer, msg);
    }
  }
  MixerService.prototype.onCoinJoinFinish = function(msg) {
    if (msg.sender != this.channel.fingerprint) {
      console.log("[mixer] CoinJoinFinish", msg);
      this.processFinish(msg.peer, msg);
    }
  }

  return MixerService;

});
