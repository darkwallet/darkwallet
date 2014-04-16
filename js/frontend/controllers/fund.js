/**
 * @fileOverview FundCtrl angular controller
 */

define(['./module', 'bitcoinjs-lib'],
function (controllers, Bitcoin) {
  'use strict';

  var convert = Bitcoin.convert;

  controllers.controller('FundCtrl', ['$scope', 'notify', function($scope, notify) {

  $scope.Object = Object;

  /**
   * Check if we have enough signatures and put them into the transaction
   */
  var finishSigning = function(fund, task) {
    // task format:
    // task: {tx: tx, task: task} (added in frontend)
    // task: {tx: hexTx, 'pending': pending, stealth: metadata.stealth};
    // pending:  [{output: utxo.output, address: utxo.address, index: idx, signatures: {}, type: outAddress?outAddress.type:'signature'}] ...

    var script = convert.hexToBytes(fund.script);

    var organizeSignatures = function(hexSigs) {
        var signatures = [];
        fund.participants.forEach(function(participant, i) {
            if (hexSigs.hasOwnProperty(i)) {
                signatures.push(hexSigs[i]);
            } else {
                // do nothing
            }
        });
        return signatures;
    }
    var finished = true;
    task.task.pending.forEach(function(input) {
        var hexSigs = organizeSignatures(input.signatures);

        console.log(fund.m, hexSigs, Object.keys(input.signatures))
        if (Object.keys(input.signatures).length >= fund.m) {
            // convert inputs to bytes
            var sigs = hexSigs.map(function(sig) {return sig?convert.hexToBytes(sig):sig});
            console.log("apply multisigs"); 
            // apply multisigs
            task.tx.applyMultisigs(input.index, script, sigs, 1);
        } else {
            finished = false;
        }
    });
    if (finished) {
        task.task.tx = task.tx.serializeHex();
    }

    // Callback listening for radar events
    var broadcastCallback = function(err, data) {
        console.log("radar feedback", data);
        if (err) {
           task.error = "Failed: " + err;
           notify.warning("Failed Broadcasting", "Imported but failed to broadcast " + err);
        } else if (data.type == 'radar' && !isBroadcast) {
           task.broadcasted = true;
           task.radar = data.radar;
           task.broadcasting = false;
           notify.success('Imported', 'Signature imported and sent to broadcaster!');
        } else if (data.type == 'radar') {
           task.radar = data.radar;
           notify.note('Broadcasting', 'Radar: ' + data.radar);
        }
        if (!$scope.$$phase) {
           $scope.$apply();
        }
    }

    // Broadcast
    if (finished) {
        task.broadcasting = true;
        var walletService = DarkWallet.service().getWalletService();
        walletService.broadcastTx(task.tx, false, broadcastCallback);
    }

    return finished;
  }

  /**
   * Import a signature
   */
  $scope.importFundSig = function(form, task) {
    var sigHex = form.text;
    // TODO: should check to see it's valid for this tx
    // TODO: can't just import a signature like this for all inputs,
    // lets hope there is just one for now ..
    try {
       var sig = convert.hexToBytes(sigHex);
    } catch(e) {
       notify.error('Malformed signature');
       return;
    }
    var added = false;
    var fund = $scope.pocket.fund;

    // Check where this signature goes
    var script = new Bitcoin.Script(convert.hexToBytes(fund.script));
    task.task.pending.forEach(function(input) {
        var txHash = task.tx.hashTransactionForSignature(script, input.index, 1);
        fund.pubKeys.forEach(function(pubKey, pIdx) {
            if (Bitcoin.ecdsa.verify(txHash, sig, pubKey)) {
                input.signatures[pIdx] = sigHex;
                added = true;
            }
        });
    });

    // Show some notification and finish task if we have all signatures.
    if (added) {
        if (finishSigning(fund, task)) {
            // Wait for notification from broadcasting
        } else {
            notify.success('Imported', 'Signature imported');
        }
    } else {
        notify.warning('Error importing', 'Cant verify');
    }
  }

  /**
   * Import a partial transaction into the fund
   */
  $scope.importFundTx = function(form) {
    if (form.$valid) {
      var hexTx = form.newTx;

      // import transaction here
      var identity = $scope.identity;
      var fund = $scope.pocket.fund;
      var walletAddress = identity.wallet.getWalletAddress(fund.address);

      // Go on
      if (walletAddress) {
          // we import the tx
          var tx;
          try {
              tx = Bitcoin.Transaction.deserialize(hexTx);
          } catch(e) {
              notify.error('Error importing', 'Malformed transaction');
              console.log(e)
              return;
          }
          // Find our inputs
          var inputs = identity.wallet.txForAddress(walletAddress, tx);

          if (inputs.length == 0) {
              notify.error('Error importing', 'Transaction is not for this multisig');
              return;
          }
          // Check if we have the tx
          var tasks = identity.tasks.getTasks('multisig');
          for(var i=0; i<tasks.length; i++) {
              var task = tasks[i];
              if (task.tx == hexTx) {
                  notify.error('Error importing', 'Already have this transaction!');
                  return;
              }
          }

          // Now create the task
          var pending = [];
          inputs.forEach(function(input) {
              var out = input.outpoint.hash+':'+input.outpoint.index;
              pending.push({output: out, address: input.address, index: input.index, signatures: {}, type: 'multisig'});
          });
          var task = {tx: hexTx, 'pending': pending, stealth: false};
          var frontTask = {tx: tx, task: task};

          // Add to tasks
          $scope.pocket.tasks.push(frontTask);
          notify.success('Added transaction');
      }
    }
  }

  /**
   * Continue signing after getting the password
   */
  var finishSignFundTx = function(password, fund, task, inputs) {
      var identity = $scope.identity;
      var script = convert.hexToBytes(fund.script)

      var signed = false;
      // find key
      $scope.pocket.participants.forEach(function(participant, pIdx) {
          if (participant.type == 'me') {
              var seq = participant.address.index;
              identity.wallet.getPrivateKey(seq, password, function(privKey) {
                inputs.forEach(function(input, i) {
                  var sig = task.tx.p2shsign(input.index, script, privKey.toBytes(), 1);
                  var hexSig = convert.bytesToHex(sig);
                  task.task.pending[i].signatures[pIdx] = hexSig
                  signed = true;
                });
                task.task.canSign = false;
              });
          }
      });
      if (!signed) {
          notify.warning("Transaction was already signed by us");
          return;
      }
      if (finishSigning(fund, task)) {
          notify.success('Signed transaction and ready to go!');
      } else {
          notify.success('Signed transaction');
      }
  }

  /**
   * Sign a transaction with our keys
   */
  $scope.signFundTx = function(task) {
      // import transaction here
      var identity = $scope.identity;
      var fund = $scope.pocket.fund;
      var walletAddress = identity.wallet.getWalletAddress(fund.address);

      if (walletAddress) {
          // we import the tx
          var inputs = identity.wallet.txForAddress(walletAddress, task.tx);
          console.log(task.tx)
          if (inputs.length == 0) {
              // Shouldn't happen
              notify.error('Error importing', 'Transaction is not for this multisig');
              return;
          }
          $scope.openModal('ask-password', {text: 'Unlock password', password: ''}, function(password) { finishSignFundTx(password, fund, task, inputs); } )
      }
  }

}]);
});
