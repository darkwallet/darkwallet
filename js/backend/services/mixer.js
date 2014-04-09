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
    console.log("[mixer] Check mixing...");
    var lobbyTransport = this.core.getLobbyTransport();
    if (!this.channel) {
      this.channel = lobbyTransport.initChannel('CoinJoin', Channel);
      this.channel.addCallback('lobby', this.onLobbyMessage);
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
   * Lobby message arrived
   */
  MixerService.prototype.onLobbyMessage = function(data) {
    console.log("[mixer] lobby message " + data);
  }

  return MixerService;

});
