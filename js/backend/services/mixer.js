'use strict';

define(['backend/port', 'backend/channels/catchan', 'util/protocol', 'bitcoinjs-lib', 'util/coinjoin', 'util/btc', 'sjcl'],
function(Port, Channel, Protocol, Bitcoin, CoinJoin, BtcUtils) {

  /*
   * Service managing mixing.
   * @constructor
   */
  function MixerService(core) {
    var self = this;
    this.name = 'mixer';
    this.core = core;
    this.ongoing = {};

    // Port for communication with other services
    Port.connect('obelisk', function(data) {
      // WakeUp when connected to obelisk
      if (data.type == 'disconnect') {
        self.stopTasks();
      }
      else if (data.type == 'connected') {
        self.checkMixing();
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
    var safe = this.core.service.safe;

    // Check to see we have anything to mix
    var anyMixing = false;
    identity.wallet.pockets.hdPockets.forEach(function(pocket, i) {
      if (pocket && pocket.mixing) {
        if (pocket.privKey || pocket.privChangeKey) {
            // do we still have access to the password?
            var password = safe.get('mixer', 'pocket:'+i);
            if (!password) {
                console.log("[mixer] Disabling pocket because security context expired");
                pocket.privKey = undefined;
                pocket.privChangeKey = undefined;
                pocket.mixing = false;
            }
        }
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
  };

  /*
   * Initialize the mixer connection
   */
  MixerService.prototype.ensureMixing = function() {
    var self = this;
    console.log("[mixer] Check mixing...");
    var lobbyTransport = this.core.getLobbyTransport();
    if (!this.channel) {
      this.channel = lobbyTransport.initChannel('CoinJoin', Channel);
      this.channel.addCallback('CoinJoinOpen', function(_d) {self.onCoinJoinOpen(_d);});
      this.channel.addCallback('CoinJoin', function(_d) {self.onCoinJoin(_d);});
      this.channel.addCallback('CoinJoinFinish', function(_d) {self.onCoinJoinFinish(_d);});
    }
  };

  /*
   * Stop mixing
   */
  MixerService.prototype.stopMixing = function() {
    console.log("[mixer] Stop mixing...");
    if (this.channel) {
      var lobbyTransport = this.core.getLobbyTransport();
      try {
          lobbyTransport.closeChannel(this.channel.name);
      } catch(e) {
          // doesnt exist any more
      }
      this.channel = null;
    }
  };

  // Tasks

  MixerService.prototype.stopTasks = function(task) {
    this.ongoing = {};
  }

  /*
   * Check a running task to see if we have to resend or cancel
   */
  MixerService.prototype.checkTask = function(msg, state) {
      var coinJoin = this.ongoing[msg.body.id];
      // Check if the state is the same otherwise cancel
      if (coinJoin && coinJoin.state == state) {
          var start = coinJoin.task.start;
          var timeout = coinJoin.task.timeout;
          // Cancel task if it expired
          if ((Date.now()/1000)-start > timeout) {
              // do stuff
              console.log("[mixer] Cancelling coinjoin!", msg.body.id);
              var walletService = this.core.service.wallet;
              walletService.sendFallback('mixer', coinJoin.task);
          } else {
              // Otherwise resend
              this.postRetry(msg, state);
          }
      }
  }

  /*
   * Send a message on the channel and schedule a retry
   */
  MixerService.prototype.postRetry = function(msg, state) {
      var self = this;
      this.channel.postEncrypted(msg, function(err, data) {
          if (err) {
            console.log("[mixer] Error announcing join!");
          } else {
            console.log("[mixer] Join announced!");
          }
      });
      setTimeout(function() {
            self.checkTask(msg, state);
      }, 10000);
  }

  /**
   * Announce a coinjoin.
   */
  MixerService.prototype.announce = function(id, coinJoin) {
      var msg = Protocol.CoinJoinOpenMsg(id, coinJoin.task.total);
      this.checkTask(msg, 'announce');
  };

  /*
   * Start a task either internally or by external command
   */
  MixerService.prototype.startTask = function(task) {
    // Make sure the mixer is enabled
    this.ensureMixing();

    // Now do stuff with the task...
    switch(task.state) {
      case 'announce':
        var id = Bitcoin.CryptoJS.SHA256(Math.random()+'').toString();
        console.log("[mixer] Announce join");
        var myTx = new Bitcoin.Transaction(task.tx);
        myTx = BtcUtils.fixTxVersions(myTx, this.core.getCurrentIdentity());
        if (!task.timeout) {
           task.timeout = 60;
        }
        if (!task.start) {
           task.start = Date.now()/1000;
        }
        this.ongoing[id] = new CoinJoin(this.core, 'initiator', 'announce', BtcUtils.fixTxVersions(myTx.clone(), this.core.getCurrentIdentity()), task.total, task.fee);
        this.ongoing[id].task = task;

        // See if the task is expired otherwise send
        this.announce(id, this.ongoing[id]);
        break;
      case 'paired':
      case 'finish':
      case 'finished':
      default:
        console.log('[mixer] start Task!', task.state, task);
        break;
    }
  };

  /*
   * Count the number of pending tasks
   */
  MixerService.prototype.pendingTasks = function() {
    var identity = this.core.getCurrentIdentity();
    console.log('[mixer] check Tasks!');

    return identity.tasks.getTasks('mixer').length;
  };

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
  };

  /*
   * Find a pocket in mixing state with enough satoshis
   */
  MixerService.prototype.findMixingPocket = function(amount) {
    var identity = this.core.getCurrentIdentity();
    var pockets = identity.wallet.pockets.hdPockets;
    for(var i=0; i<pockets.length; i++) {
      var pocket = pockets[i];
      if (!pocket) {
          continue;
      }
      if (pocket.mixing) {
        var balance = identity.wallet.getBalance(i*2).confirmed + identity.wallet.getBalance((i*2)+1).confirmed;
        if (balance >= amount) {
            return i;
        }
      }
    };
    return -1;
  };

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
      var destAddress = identity.wallet.getFreeAddress(pocketIndex*2);

      var recipient = {address: destAddress.address, amount: opening.amount};

      // Build the tx
      var metadata = identity.wallet.prepareTx(pocketIndex, [recipient], changeAddress, fee);
      this.ongoing[opening.id] = new CoinJoin(this.core, 'guest', 'accepted', metadata.tx.clone(), opening.amount, fee);
      this.ongoing[opening.id].pocket = pocketIndex;

      // Post using end to end channel capabilities
      this.sendTo(peer, opening.id, metadata.tx);
    }
  };

  MixerService.prototype.sendTo = function(peer, id, tx, callback) {
      // Save the transaction with the ongoing task
      var coinJoin = this.ongoing[id];
      coinJoin.peer = peer;

      // Now create and send the message
      var msg = Protocol.CoinJoinMsg(id, tx.serializeHex());
      this.channel.postDH(peer.pubKey, msg, function(err, data) {
          callback ? callback(err, data) : null;
      });
  };

  /*
   * Check join state to see if we need to delete, and do it
   */
  MixerService.prototype.checkDelete = function(id) {
      var coinJoin = this.ongoing[id];
      if (['finished', 'cancelled'].indexOf(coinJoin.state) != -1) {
          console.log("[mixer] Deleting coinjoin because " + coinJoin.state);
          delete this.ongoing[id];
      }
  };

  /*
   * Get a running coinjoin from a message doing some tests
   */
  MixerService.prototype.getOngoing = function(msg) {
      var coinJoin = this.ongoing[msg.body.id];
      if (!coinJoin) {
          console.log("[mixer] CoinJoin not found!");
      }
      else if (coinJoin.state != 'announce' && msg.peer.fingerprint != coinJoin.peer.fingerprint) {
          console.log("[mixer] CoinJoin message from the wrong peer!", msg);
          return;
      }
      return coinJoin;
  };

  /**
   * Get the host private keys for a mix
   */
  MixerService.prototype.hostPrivateKeys = function(coinJoin) {
      var safe = this.core.service.safe;
      var txHash = Bitcoin.convert.bytesToString(coinJoin.myTx.getHash());

      var password = safe.get('send', txHash);

      return JSON.parse(sjcl.decrypt(password, coinJoin.task.privKeys));
  };

  /**
   * Get the guest private keys for a mix
   */
  MixerService.prototype.guestPrivateKeys = function(coinJoin) {
      var identity = this.core.getIdentity();
      var safe = this.core.service.safe;
      var pocketIndex = coinJoin.pocket;

      // Get our password from the safe
      var password = safe.get('mixer', 'pocket:'+pocketIndex);

      // Load master keys for the pockets
      var pocket = identity.wallet.pockets.hdPockets[pocketIndex];
      var masterKey = Bitcoin.HDWallet.fromBase58(sjcl.decrypt(password, pocket.privKey));
      var changeKey = Bitcoin.HDWallet.fromBase58(sjcl.decrypt(password, pocket.privChangeKey));

      // Iterate over tx inputs and load private keys
      var privKeys = {};
      for(var i=0; i<coinJoin.myTx.ins.length; i++) {
          var anIn = coinJoin.myTx.ins[i];
          var output = identity.wallet.wallet.outputs[anIn.outpoint.hash+":"+anIn.outpoint.index];
          // we're only adding keyhash inputs for now
          if (!output) {
              throw Error("Invalid input in our join (no output)");
          }
          var walletAddress = identity.wallet.getWalletAddress(output.address);

          // only normal addresses supported for now
          if (!walletAddress || walletAddress.type) {
              throw Error("Invalid input in our join (bad address)");
          }
          // skip if we already got this key
          if (privKeys[walletAddress.index]) {
              continue;
          }
          if (Math.floor(walletAddress.index[0]/2) != pocketIndex) {
              throw Error("Address from an invalid pocket");
          }
          // derive this key
          var change  = walletAddress.index[0]%2 == 1;
          privKeys[walletAddress.index] = identity.wallet.deriveHDPrivateKey(walletAddress.index.slice(1), change?changeKey:masterKey).toBytes();
      }
      return privKeys;
  };

  /*
   * Sign inputs for a coinjoin
   */
  MixerService.prototype.requestSignInputs = function(coinJoin) {
      var privKeys;
      var identity = this.core.getIdentity();
      if (coinJoin.task) {
          privKeys = this.hostPrivateKeys(coinJoin);
      } else {
          privKeys = this.guestPrivateKeys(coinJoin);
          
      }
      var signed = identity.wallet.signMyInputs(coinJoin.myTx.ins, coinJoin.tx, privKeys);
      return signed;
  };

  /*
   * Protocol messages arriving
   */
  MixerService.prototype.onCoinJoinOpen = function(msg) {
    if (!msg.peer || !msg.peer.trusted) {
      console.log("[mixer] Peer not found " + msg.sender, msg.peer);
      return;
    }
    if (msg.sender != this.channel.fingerprint) {
      console.log("[mixer] CoinJoinOpen", msg.peer);
      this.evaluateOpening(msg.peer, msg.body);
    } else {
      console.log("[mixer] My CoinJoinOpen is back", msg);
    }
  };

  MixerService.prototype.onCoinJoin = function(msg) {
    if (msg.sender != this.channel.fingerprint) {
      var coinJoin = this.getOngoing(msg);
      if (coinJoin) {
          console.log("[mixer] CoinJoin", msg);

          var updatedTx = coinJoin.process(msg.body);
          // if requested to sign, try to do it
          if (coinJoin.state == 'sign') {
              // Needs signing from user
              var signed = this.requestSignInputs(coinJoin);
              if (signed) {
                  updatedTx = coinJoin.addSignatures(coinJoin.tx);
              }
          }
          if (updatedTx && coinJoin.state != 'sign') {
              this.sendTo(msg.peer, msg.body.id, updatedTx);
          }
          Port.post('gui', {type: 'mixer', state: coinJoin.state});
          if (coinJoin.state == 'sign') {
              console.log("task requires signing from user!");
          }
          // copy coinjoin state to the store
          if (coinJoin.task) {
              coinJoin.task.state = coinJoin.state;
          }
          // Check state and perform appropriate tasks
          if (coinJoin.state == 'finished' && coinJoin.task) {
              var onBroadcast = function(_error, _data) {
                  console.log("broadcasting!", _error, _data);
              }
              var walletService = this.core.service.wallet;
              coinJoin.task.tx = coinJoin.tx.serializeHex();
              walletService.broadcastTx(coinJoin.tx, coinJoin.task, onBroadcast);
          } else if (coinJoin.state == 'announce') {
              // announce again
              this.announce(msg.body.id, coinJoin);
          }
          this.checkDelete(msg.body.id);

          // See if we should desactivate mixing
          this.checkMixing();
      }
    }
  };
  MixerService.prototype.onCoinJoinFinish = function(msg) {
    if (msg.sender != this.channel.fingerprint) {
      console.log("[mixer] CoinJoinFinish", msg);
      var coinJoin = this.getOngoing(msg);
      if (coinJoin) {
        coinJoin.kill(msg.body);
        this.checkDelete(msg.body.id);
      }
    }
  };

  return MixerService;

});
