'use strict';

define(['bitcoinjs-lib', 'util/btc'], function(Bitcoin, BtcUtils) {

  /*
   * CoinJoin Class
   * @constructor
   */
  function CoinJoin(core, role, state, tx, myAmount, fee, peer) {
    this.core = core;
    this.state = state;
    this.role = role;
    this.myTx = tx;
    this.myAmount = myAmount;
    this.fee = fee;
    // Peer set initially for guest
    this.peer = peer;
  }

  /**
   * Randomize array element order in-place.
   * Using Fisher-Yates shuffle algorithm.
   */
  CoinJoin.prototype.shuffleArray = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
       array[i] = array[j];
       array[j] = temp;
    }
    return array;
  }


  /*
   * Randomize join outputs and inputs
   * Happens on the first fullfill by the initiator, and first sign by the guest.
   */
  CoinJoin.prototype.randomize = function(tx) {
      var self = this;
      tx = tx.clone();
      var newTx = new Bitcoin.Transaction();
      var stealth = [];

      // Add non stealth outputs, and keep a matrix of where to put them after
      tx.outs.forEach(function(anOut, idx) {
          if (self.isStealth(anOut) && tx.outs.length > idx) {
              // Save an array with the nonce output and then the related output
              stealth.push([anOut, tx.outs[idx+1]]);
          } else {
              // this will just push the same output into newTx.outs
              newTx.addOutput(tx.outs[idx].script, tx.outs[idx].value);
          }
      });

      // Copy inputs since no need to keep any order
      newTx.ins = tx.ins.slice(0);

      // Now shuffle the transaction
      this.shuffleArray(newTx.ins);
      this.shuffleArray(newTx.outs);

      // Now re-insert (possibly) stealth information
      stealth.forEach(function(nonces) {
          var origOut = nonces[1];
          var found = newTx.outs.filter(function(newOut) {
             return (origOut.script.toHex() === newOut.script.toHex()) && (origOut.value === newOut.value);
          });
          if (found.length === 1) {
              var index = newTx.outs.indexOf(found[0]);
              // add the output back
              newTx.addOutput(nonces[0].script, nonces[0].value);
              // now set it in place
              newTx.outs.splice(index, 0, newTx.outs.pop());
          } else {
              throw Error("Cant add output");
          }
      });

      return newTx;
  }

  /*
   * CoinJoin State machine once paired
   * 1st message guest -> [initiator]
   */
  CoinJoin.prototype.fullfill = function(msg, peer) {
      // Check there is one output like we want to join
      var amount = this.myAmount;
      var remoteTx = Bitcoin.Transaction.fromHex(msg.tx);
      var isOk = false;
      remoteTx.outs.forEach(function(anOut) {
          if (anOut.value == amount) {
              isOk = true;
          }
      });
      if (!isOk) {
          console.log("no output found with the right value");
          return;
      }
      // Now check there are inputs with enough funds
      isOk = false;

      // Now add our inputs and outputs after the ones from guest
      var myTx = this.myTx;
      myTx.ins.forEach(function(anIn) {
          remoteTx.addInput(anIn.hash, anIn.index);
      });
      myTx.outs.forEach(function(anOut) {
          remoteTx.addOutput(anOut.script, anOut.value);
      });

      // Randomize inputs and outputs
      remoteTx = this.randomize(remoteTx);

      // Check the original inputs and outputs are there
      if (!this.checkMyInputsOutputs(this.myTx, remoteTx)) {
          this.cancel();
          return;
      }

      // Save tx
      this.tx = remoteTx;
      this.state = 'fullfilled';

      // Lock peer
      this.peer = peer;
      return remoteTx;
  };

  /*
   * 1st message initiator -> [guest]
   */
  CoinJoin.prototype.sign = function(msg, peer) {
      if (peer != this.peer) {
          return;
      }
      var remoteTx = Bitcoin.Transaction.fromHex(msg.tx);

      // Randomize inputs and outputs
      remoteTx = this.randomize(remoteTx);

      // Check the original inputs and outputs are there
      if (!this.checkMyInputsOutputs(this.myTx, remoteTx)) {
          this.cancel();
          return;
      }

      // Needs signing of inputs
      this.tx = remoteTx;
      this.state = 'sign';
      return remoteTx;
  };

  /*
   * Add signatures manually
   * tx: Transaction with user inputs signed
   */
  CoinJoin.prototype.addSignatures = function(tx) {
      // Save tx
      // TODO: maybe check signatures, but they come from the application here
      this.tx = tx;
      if (this.role == 'initiator') {
          this.state = 'finished';
      } else {
          this.state = 'signed';
      }
      return tx;
  }

  /*
   * 2nd message guest -> [initiator]
   */
  CoinJoin.prototype.finishInitiator = function(msg, peer) {
      if (peer != this.peer) {
          return;
      }
      var myTx = this.tx;
      var remoteTx = Bitcoin.Transaction.fromHex(msg.tx);

      // Check no new inputs or outputs where added
      if (!this.checkInputsOutputs(myTx, remoteTx)) {
          this.cancel();
          return;
      }

      // Check the guest signed

      // Now sign our input(s) against the outputs
      this.tx = remoteTx;
      this.state = 'sign';
      return remoteTx;
  };

  /*
   * 2nd message initiator -> [guest]
   */
  CoinJoin.prototype.finishGuest = function(msg, peer) {
      if (peer != this.peer) {
          return;
      }
      var remoteTx = Bitcoin.Transaction.fromHex(msg.tx);

      // Check no new inputs or outputs where added
      if (!this.checkInputsOutputs(this.tx, remoteTx)) {
          this.cancel();
          return;
      }

      // Check our signatures are there

      // Check the inititator signed

      // We are done here...

      // Save tx
      this.state = 'finished';
      this.tx = remoteTx;
      return remoteTx;
  };

  /*
   * Process a message for an ongoing CoinJoin
   */
  CoinJoin.prototype.process = function(msg, peer) {
      switch (this.state) {
          case 'announce':
              // 1. If initiator, comes with new input and outputs from guest
              return this.fullfill(msg, peer);
          case 'accepted':
              // 2. If guest, comes with full tx, check and sign
              return this.sign(msg, peer);
          case 'fullfilled':
              // 3. Initiator finally signs his part
              return this.finishInitiator(msg, peer);
          case 'signed':
              // 4. Guest getting the final transaction
              return this.finishGuest(msg, peer);
      }
  };

  CoinJoin.prototype.cancel = function() {
      if (this.role == 'initiator') {
          // Back to announce state
          this.state = 'announce';
      }
      else if (this.role == 'guest') {
          this.state = 'cancelled';
      }
  };

  /*
   * Process a message finishing a coinjoin conversation
   */
  CoinJoin.prototype.kill = function(body, peer) {
     // Only allow finish messages from our peer
     if (peer != this.peer) {
        return;
     }
     switch(this.state) {
         case 'accepted':
         case 'fullfilled':
         case 'signed':
             this.cancel();
             break;
         case 'finished':
         case 'announce':
         default:
             // do nothing
             break;
     }

  };

  /*
   * Helper functions
   */
  CoinJoin.prototype.isStealth = function(anOut) {
      // Value must be 0, size 38, first byte OP_RETURN and there must be an output after this one
      return (anOut.value == 0 && anOut.script.toBuffer().length >= 38 && anOut.script.toBuffer()[0] == Bitcoin.opcodes.OP_RETURN);
  };

  CoinJoin.prototype.checkInputsOutputs = function(origTx, newTx) {
      var isValid = true;
      if (origTx.ins.length != newTx.ins.length) return false;
      if (origTx.outs.length != newTx.outs.length) return false;

      isValid = this.checkMyInputsOutputs(origTx, newTx);

      return isValid;
  };

  CoinJoin.prototype.checkMyInputsOutputs = function(origTx, newTx) {
      for(var i=0; i<origTx.ins.length; i++) {
          // TODO: should check the scripts too
          var origInP = origTx.ins[i];
          var found = newTx.ins.filter(function(newIn) {
              return (origInP.hash.toString('hex') == newIn.hash.toString('hex')) && (parseInt(origInP.index) == parseInt(newIn.index));
          });
          if (found.length != 1) return false;
      }
      for(var i=0; i<origTx.outs.length; i++) {
          var origOut = origTx.outs[i];
          var found = newTx.outs.filter(function(newOut) {
             return (origOut.script.toHex() === newOut.script.toHex()) && (origOut.value === newOut.value);
          });
          if (found.length != 1) return false;
          // Check stealth is ordered
          var isStealth = this.isStealth(origOut) && origTx.outs.length > i;
          if (isStealth) {
              var j = newTx.outs.indexOf(found[0]);
              if (!origTx.outs[i+1] || !newTx.outs[j+1] || origTx.outs[i+1].script.toHex() != newTx.outs[j+1].script.toHex()) {
                  console.log("unordered stealth");
                  return false;
              }
          }
      }
      return true;
  };


  return CoinJoin;

});
