define(['backend/services', 'backend/channels/catchan', 'util/protocol', 'bitcoinjs-lib', 'util/coinjoin'],
function(Services, Channel, Protocol, Bitcoin, CoinJoin) {
  'use strict';

  /*
   * Service managing mixing.
   * @constructor
   */
  function MixerService(core) {
    var self = this;
    this.core = core;
    this.ongoing = {};

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
        var id = Bitcoin.Crypto.SHA256(Math.random()+'').toString();
        var msg = Protocol.CoinJoinOpenMsg(id, task.myamount);
        console.log("[mixer] Announce join");
        var myTx = new Bitcoin.Transaction(task.tx);
        this.ongoing[id] = new CoinJoin(this.core, 'initiator', 'announce', myTx.clone(), task.myamount, task.fee);
        this.ongoing[id].task = task;

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
        break;
    }
  }

  /*
   * Count the number of pending tasks
   */
  MixerService.prototype.pendingTasks = function() {
    var identity = this.core.getCurrentIdentity();
    console.log('[mixer] check Tasks!', identity);

    return identity.tasks.getTasks('mixer').length;
  }

  /*
   * Resume available (pending) tasks
   */
  MixerService.prototype.resumeTasks = function() {
    var self = this;
    var identity = this.core.getCurrentIdentity();

    var tasks = identity.tasks.getTasks('mixer');
    tasks.forEach(function(task) {
      self.startTask(task);
    });
  }

  /*
   * Find a pocket in mixing state with enough satoshis
   */
  MixerService.prototype.findMixingPocket = function(amount) {
    var identity = this.core.getCurrentIdentity();
    var pockets = identity.wallet.pockets;
    for(var i=0; i<pockets.length; i++) {
      var pocket = pockets[i];
      if (pocket.mixing) {
        var balance = identity.wallet.getBalance(i);
        if (balance >= amount) {
            return i;
        }
      }
    };
    return -1;
  }

  /*
   * Evaluate a coinjoin opening and respond if appropriate.
   */
  MixerService.prototype.evaluateOpening = function(peer, opening) {

    if (this.ongoing.hasOwnProperty(opening.id)) {
        console.log("[mixer] We already have this task!");
        return;
    }
    var fee = 50000; // 0.5 mBTC
    var identity = this.core.getCurrentIdentity();

    // Evaluate mixing pockets to see if we can pair

    var pocketIndex = this.findMixingPocket(opening.amount+fee);

    // If we found a pocket, continue with the protocol.
    if (pocketIndex != -1) {
      // Prepare arguments for preparing the tx
      var changeAddress = identity.wallet.getChangeAddress(pocketIndex);
      var destAddress = identity.wallet.getFreeAddress(pocketIndex);

      var recipient = {address: destAddress.address, amount: opening.amount};

      // Build the tx
      var tx = identity.wallet.prepareTx(pocketIndex, [recipient], changeAddress, fee);
      this.ongoing[opening.id] = new CoinJoin(this.core, 'guest', 'accepted', tx.clone(), opening.amount, fee);
      // Post using end to end channel capabilities
      this.sendTo(peer, opening.id, tx.tx)
    }
  }

  MixerService.prototype.sendTo = function(peer, id, tx, callback) {
      // Save the transaction with the ongoing task
      var coinJoin = this.ongoing[id];
      coinJoin[id].peer = peer;

      // Now create and send the message
      var msg = Protocol.CoinJoinMsg(id, tx.serializeHex());
      this.channel.postDH(peer.pubKey, msg, function(err, data) {
          callback ? callback(err, data) : null;
      });
  }

  /*
   * Check join state to see if we need to delete, and do it
   */
  MixerService.prototype.checkDelete = function(id) {
      var coinJoin = this.ongoing[id];
      if (['finished', 'cancelled'].indexOf(coinJoin.state) != -1) {
          console.log("[mixer] Deleting coinjoin because " + coinJoin.state);
          delete this.ongoing[id];
      }
  }

  /*
   * Get a running coinjoin from a message doing some tests
   */
  MixerService.prototype.getOngoing = function(msg) {
      var coinJoin = this.ongoing[msg.id];
      if (!coinJoin) {
          console.log("[mixer] CoinJoin not found!");
      }
      else if (coinJoin.state != 'announce' && msg.peer.fingerprint != coinJoin.peer.fingerprint) {
          console.log("[mixer] CoinJoin message from the wrong peer!", msg);
          return;
      }
      return coinJoin;
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
      this.evaluateOpening(msg.peer, msg.body);
    } else {
      console.log("[mixer] My CoinJoinOpen is back", msg);
    }
  }
  MixerService.prototype.onCoinJoin = function(msg) {
    if (msg.sender != this.channel.fingerprint) {
      var coinJoin = this.getOngoing(msg);
      if (coinJoin) {
          console.log("[mixer] CoinJoin", msg);

          var updatedTx = coinJoin.process(msg.peer, msg.body);
          if (updatedTx) {
              this.sendTo(msg.peer, msg.id, updatedTx);
          }
          this.checkDelete(msg.id);
      }
    }
  }
  MixerService.prototype.onCoinJoinFinish = function(msg) {
    if (msg.sender != this.channel.fingerprint) {
      console.log("[mixer] CoinJoinFinish", msg);
      var coinJoin = this.getOngoing(msg);
      if (coinJoin) {
        coinJoin.kill(msg.body);
        this.checkDelete(msg.id);
      }
    }
  }

  return MixerService;

});
