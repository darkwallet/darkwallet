define(['backend/services', 'backend/channels/catchan', 'util/protocol', 'bitcoinjs-lib'],
function(Services, Channel, Protocol, Bitcoin) {
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
        this.ongoing[id] = {role: 'initiator', myTx: myTx.clone(), tx: myTx, state: 'announce', task: task};
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
   * Find a pocket in mixing state with enough satoshis
   */
  MixerService.prototype.getMixingPocket = function(amount) {
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

    var pocketIndex = this.getMixingPocket(opening.amount+fee);

    // If we found a pocket, continue with the protocol.
    if (pocketIndex != -1) {
      // Prepare arguments for preparing the tx
      var changeAddress = identity.wallet.getChangeAddress(pocketIndex);
      var destAddress = identity.wallet.getFreeAddress(pocketIndex);

      var recipient = {address: destAddress.address, amount: opening.amount};

      // Build the tx
      var tx = identity.wallet.prepareTx(pocketIndex, [recipient], changeAddress, fee);
      this.ongoing[opening.id] = {state: 'accepted', role: 'guest', peer: peer, myTx: tx.clone()};
      // Post using end to end channel capabilities
      this.sendTo(peer, opening.id, tx.tx)
    }
  }

  MixerService.prototype.sendTo = function(peer, id, tx, callback) {
      // Save the transaction with the ongoing task
      var task = this.ongoing[id];
      task[id].tx = tx;

      // Now create and send the message
      var msg = Protocol.CoinJoinMsg(id, tx.serializeHex());
      this.channel.postDH(peer.pubKey, msg, function(err, data) {
          callback ? callback(err, data) : null;
      });
  }

  MixerService.prototype.signMyInputs = function(myTx, newTx) {
      var identity = this.core.getCurrentIdentity();
      for(var i=0; i<newTx.ins; i++) {
          var anIn = newTx.ins[i];
          if (identity.txdb.transactions.hasOwnProperty(anIn.outpoint.hash)) {
              var prevTxHex = identity.txdb.transactions[anIn.outpoint.hash];
              var prevTx = new Bitcoin.Transaction(prevTxHex);
              var output = prevTx.out[anIn.outpoint.index];
              var walletAddress = identity.wallet.getWalletAddress(output.address);

              var found = myTx.ins.filter(function(myIn, i) {
                  return (myIn.hash == newIn.hash) && (myIn.index == newIn.index);
              });
              if (found.length == 1) {
                  identity.wallet.getPrivateKey(walletAddress.index, password, function(privKey) {
                      newTx.sign(i, privKey);
                  });
              }
          } else {
              console.log("No wallet address for one of our addresses!");
          }
      }
  }

  MixerService.prototype.checkInputsOutputs = function(origTx, newTx) {
      var isValid = true;
      if (origTx.ins.length != newTx.ins.length) return false;
      if (origTx.outs.length != newTx.outs.length) return false;

      isValid = this.checkMyInputsOutputs(origTx, newTx);

      return isValid;
  }

  MixerService.prototype.checkMyInputsOutputs = function(origTx, newTx) {
      for(var i=0; i<origTx.ins.length; i++) {
          // TODO: should check the scripts too
          var origIn = origTx.ins[i];
          var found = newTx.ins.filter(function(newIn) {
              return (origIn.hash == newIn.hash) && (origIn.index == newIn.index);
          });
          if (found.length != 1) return false;
      }
      for(var i=0; i<origTx.outs.length; i++) {
          var origOut = origTx.outs[i];
          var found = newTx.outs.filter(function(newOut) {
             return (origOut.address != newOut.address) && (origOut.value != newOut.value) ;
          });
          if (found.length != 1) return false;
      }
      return true;
  }

  /*
   * CoinJoin State machine once paired
   * 1st message guest -> [initiator]
   */
  MixerService.prototype.fullfillCoinJoin = function(peer, msg, task) {
      task.peer = peer;
      // Check there is one output like we want to join
      var amount = task.task.myamount;
      var remoteTx = new Bitcoin.Transaction(msg.tx);
      var isOk = false;
      remoteTx.outs.forEach(function(anOut) {
          if (anOut.value == amount) {
              isOk = true;
          }
      })
      if (!isOk) {
          console.log("no output found with the right value");
          return;
      }
      // Now check there are inputs with enough funds
      isOk = false;

      // Now add our inputs and outputs after the ones from guest
      var myTx = task.tx;
      myTx.ins.forEach(function(anIn) {
          remoteTx.addInput(anIn.clone());
      });
      myTx.outs.forEach(function(anOut) {
          remoteTx.addOutput(anOut.clone());
      });

      // Now send message to continue
      this.sendTo(peer, msg.id, remoteTx);
  }

  /*
   * 1st message initiator -> [guest]
   */
  MixerService.prototype.signCoinJoin = function(peer, msg, task) {
      var myTx = task.tx;
      var remoteTx = new Bitcoin.Transaction(msg.tx);

      // Check the original inputs and outputs are there
      this.checkMyInputsOutputs(myTx, remoteTx);

      // Now sign our input(s) against the outputs
      this.signMyInputs(remoteTx, task.myTx);

      // Now send message to continue
      this.sendTo(peer, msg.id, remoteTx);
  }

  /*
   * 2nd message guest -> [initiator]
   */
  MixerService.prototype.finishInitiatorCoinJoin = function(peer, msg, task) {
      var myTx = task.tx;
      var remoteTx = new Bitcoin.Transaction(msg.tx);

      // Check no new inputs or outputs where added
      this.checkInputsOutputs(myTx, remoteTx);

      // Check the guest signed

      // Now sign our input(s) against the outputs
      this.signMyInputs(remoteTx, task.myTx);

      // Now send message to continue
      this.sendTo(peer, msg.id, remoteTx);

      delete this.ongoing[msg.id];
  }

  /*
   * 2nd message initiator -> [guest]
   */
  MixerService.prototype.finishGuestCoinJoin = function(peer, msg, task) {
      var myTx = task.tx;
      var remoteTx = new Bitcoin.Transaction(msg.tx);

      // Check no new inputs or outputs where added
      this.checkInputsOutputs(myTx, remoteTx);

      // Check our signatures are there

      // Check the inititator signed
      var remoteTx = new Bitcoin.Transaction(msg.tx);

      // We are done here...
      delete this.ongoing[msg.id];
  }

  /*
   * Process a message for an ongoing CoinJoin
   */
  MixerService.prototype.processCoinJoin = function(peer, msg) {
      var txHex = msg.tx;
      var task = this.ongoing[msg.id];

      if (!task) {
         console.log("We don't know this task!");
         return;
      }

      switch (task.state) {
          case 'announce':
              // 1. If initiator, comes with new input and outputs from guest
              if (this.fullfillCoinJoin()) {
                  task.state = 'fullfilled';
              }
              break;
          case 'accepted':
              // 2. If guest, comes with full tx, check and sign
              if (this.signCoinJoin()) {
                  task.state = 'signed';
              }
              break;
          case 'fullfilled':
              // 3. Initiator finally signs his part
              if (this.finishInitiatorCoinJoin()) {
                  task.state = 'finished';
              }
              break;
          case 'signed':
              // 3. Initiator finally signs his part
              if (this.finishGuestCoinJoin()) {
                  task.state = 'finished';
              }
              break;
      }
      var tx = Transaction(txHex);


  }

  MixerService.prototype.cancelCoinJoin = function(id, task) {
      if (task.role == 'initiator') {
          // Back to announce state
          task.state = 'announce';
      }
      else if (task.role == 'guest') {
          // Remove the task
          delete this.ongoing[id];
      }
  }

  /*
   * Process a message finishing a coinjoin conversation
   */
  MixerService.prototype.processFinish = function(peer, msg) {
     console.log("Finished CoinJoin", msg.id)
     var task = this.ongoing[msg.id];

     if (!task) {
         console.log("We don't know this task!");
         return;
     }
     if (peer.fingerprint != task.peer.fingerprint) {
         console.log("Finish message from the wrong peer!");
         return;
     }
     switch(task.state) {
         case 'accepted':
         case 'fullfilled':
         case 'signed':
             this.cancelCoinJoin(msg.id, task);
             break;
         case 'finished':
         case 'announce':
         default:
             // do nothing
             break;
     }

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
      console.log("[mixer] CoinJoin", msg);
      this.processCoinJoin(msg.peer, msg.body);
    }
  }
  MixerService.prototype.onCoinJoinFinish = function(msg) {
    if (msg.sender != this.channel.fingerprint) {
      console.log("[mixer] CoinJoinFinish", msg);
      this.processFinish(msg.peer, msg.body);
    }
  }

  return MixerService;

});
