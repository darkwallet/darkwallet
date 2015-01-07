'use strict';

define(['util/stealth', 'bitcoinjs-lib', 'util/btc'],
function(Stealth, Bitcoin, BtcUtils) {

/**
 * Module for transaction actions
 * @param {Object} store Store for the object.
 * @param {Object} identity Identity for the object.
 * @constructor
 */
function Transaction(store, identity) {
    this.identity = identity;
    this.store = store;
}

/**
 * Prepare a transaction with the given constraints
 * 
 * @param {String} pocketId DOCME
 * @param {Object[]} recipients DOCME
 * @param {Object} changeAddress DOCME
 * @param {Number} fee Fee for that transaction 
 * @param {Bool} reserveOutputs Whether to mark involved outputs as spent
 * @return {Object} The transaction object with the following fields:
 *   - tx
 *   - utxo
 *   - total
 *   - fee
 *   - change
 *   - myamount
 *   - stealth
 */
// was prepareTx
Transaction.prototype.prepare = function(pocketId, recipients, changeAddress, fee, reserveOutputs) {
    var newAddresses = [];
    var wallet = this.identity.wallet;
    var totalAmount = 0;
    if (fee < 0) {
        throw new Error('negative fee');
    }
    recipients.forEach(function(recipient) {
        if (recipient.amount < 0) {
            throw new Error ('negative amount');
        }
        totalAmount += recipient.amount;
    });
    var isStealth = false;

    // find outputs with enough funds
    var txUtxo;
    try {
        txUtxo = wallet.getUtxoToPay(totalAmount+fee, pocketId);
    } catch(e) {
        if (typeof e === 'string') {
            // Errors from libbitcoin come as strings
            throw new Error(e);
        } else {
            // Otherwise it must be a javascript error
            throw new Error('Error sending: {0}|'+ e.message);
        }
    }

    // Create an empty transaction
    var newTx = new Bitcoin.Transaction();

    // Add Inputs
    // and compute total utxo value for this tx
    var outAmount = 0;
    txUtxo.forEach(function(utxo) {
        outAmount += utxo.value;
        newTx.addInput(utxo.receive.split(":")[0], parseInt(utxo.receive.split(":")[1]));
    });

    // Calculate change
    var change = outAmount - (totalAmount + fee);
    var changeInto = Math.floor(Math.random()*(recipients.length+1));

    // Add Outputs
    var versions = wallet.versions;
    recipients.forEach(function(recipient, i) {
        if (change && (i === changeInto)) {
            newTx.addOutput(changeAddress.address, change);
        }
        var address = recipient.address;
        // test for stealth
        if (address[0] === versions.stealth.prefix) {
            isStealth = true;
            var res = Stealth.addStealth(address, newTx, versions.address, versions.stealth.nonce);
            address = res.address.toString();
            var newAddress = wallet.checkNewStealth(recipient.address, address, res.ephemKey, res.pubKey);
            if (newAddress) {
                newAddresses.push(newAddress);
            }
        }
        newTx.addOutput(address, recipient.amount);
    });

    if (change && (changeInto >= recipients.length)) {
        newTx.addOutput(changeAddress.address, change);
    }
    if (reserveOutputs) {
        var hash = newTx.getId();
        txUtxo.forEach(function(output, i) {
            output.markSpend(hash + ':' + i);
        });
    }
    // Return the transaction and some metadata
    return {tx: newTx, utxo: txUtxo, total: totalAmount, fee: fee, change: change, myamount: outAmount, stealth: isStealth, recipients: recipients, created: newAddresses};
};


/**
 * Sign given transaction outputs
 * @param {Object} newTx DOCME
 * @param {Object} txUtxo DOCME
 * @param {String} password DOCME
 * @param {Function} callback DOCME
 */
// was signTransaction
Transaction.prototype.sign = function(newTx, txUtxo, password, callback) {
    var wallet = this.identity.wallet;
    var pending = [];

    var hash = newTx.getId();

    // Signing
    for(var idx=0; idx<txUtxo.length; idx++) {
        var utxo = txUtxo[idx];


        var outAddress = wallet.getWalletAddress(utxo.address);
        if (!outAddress || outAddress.type === 'multisig' || outAddress.type === 'readonly') {
            pending.push({output: utxo.receive, address: utxo.address, index: idx, signatures: {}, type: outAddress?outAddress.type:'signature'});
        } else {
          // Get private keys and sign
          // Stealth backwards comp workaround, 0.4.0
          Stealth.quirk = outAddress.quirk;
          try {
            wallet.getPrivateKey(outAddress, password, function(outKey) {
                newTx.sign(idx, outKey);
            });
            Stealth.quirk = false;
          } catch (e) {
            Stealth.quirk = false;
            callback({data: e, message: "Password incorrect!", type: 'password'});
            return;
          }
        }
    }
    txUtxo.forEach(function(utxo, i) {
        utxo.markSpend(hash + ":" + i);
    });
    // No error so callback with success
    callback(null, pending);
};

/*
 * Helper functions
 * @param {Object[]} inputs Inputs we want signed
 * @param {Object} newTx Transaction to sign
 * @param {Object} privKeys Object with the private keys bytes indexed by seq
 * @return {Boolean} If signed or not
 */
// was signMyInputs
Transaction.prototype.signMyInputs = function(inputs, newTx, privKeys) {
    var wallet = this.identity.wallet;
    var signed = false;
    for(var i=0; i<newTx.ins.length; i++) {
        var anIn = newTx.ins[i];
        var found = inputs.filter(function(myIn) {
            return (myIn.hash.toString('hex') === anIn.hash.toString('hex')) && (parseInt(myIn.index) === parseInt(anIn.index));
        });
        if (found.length === 0) {
            continue;
        }
        if (found.length !== 1) {
            throw new Error('Duplicate input found!');
        }
        var inId = Bitcoin.bufferutils.reverse(anIn.hash).toString('hex')+":"+anIn.index;
        if (wallet.wallet.outputs[inId]) {
            var output = wallet.wallet.outputs[inId];

            var walletAddress = wallet.getWalletAddress(output.address);
            if (!walletAddress) {
                console.log("no wallet address for one of our inputs!", output.address);
                continue;
            }
            var privKey = Bitcoin.ECKey.fromBytes(privKeys[walletAddress.index], true);
            newTx.sign(i, privKey);
            signed = true;
        } else {
            console.log("No tx for one of our inputs");
        }
    }
    return signed;
};

/**
 * Tell whether any of the transactions inputs are ours
 * @param {String} txHash Transaction Hash
 */
// was txInputsMine
Transaction.prototype.inputsMine = function(txHash, txObj, wallet) {
    wallet = wallet || this.identity.wallet;
    var txdb = this.identity.txdb;
    var txHex = txdb.getBody(txHash);
    // if we don't have the transaction the inputs can't be ours
    if (!txObj && !txHex) {
        var keys = Object.keys(wallet.wallet.outputs);
        console.log("txInputsMine resorting to slow search");
        for(var i=0; i<keys.length; i++) {
            var output = wallet.wallet.outputs[keys[i]];
            if (output.spend && (txHash === output.spend.split(":")[0])) {
                return true;
            }
        }
        // we don't really know here :P
        return;
    }
    var tx = txObj || Bitcoin.Transaction.fromHex(txHex);
    for (var j=0; j<tx.ins.length; j++) {
        var anIn = tx.ins[j];
        if (wallet.wallet.outputs[Bitcoin.bufferutils.reverse(anIn.hash).toString('hex')+":"+anIn.index]) {
            return true;
        }
    }
    return false;
};

/*
 * Check if transaction involves given address.
 * Returns an array with involved inputs
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}
 * @param {Object} tx             
 * @return {Object[]}
 */
// was txForAddress
Transaction.prototype.forAddress = function(walletAddress, tx) {
    var identity = this.identity;
    // Maybe we could just check if we have the outpoints here instead of
    // looking for the address (but we don't have per address outpoint lists yet...).
    var inputs = [];
    for(var i=0; i<tx.ins.length; i++) {
        var outpoint = tx.ins[i];
        var txHash = Bitcoin.bufferutils.reverse(outpoint.hash).toString('hex');
        var txHex = identity.txdb.getBody(txHash);
        if (txHex) {
            var prevTx = Bitcoin.Transaction.fromHex(txHex);

            var outAddress = Bitcoin.Address.fromOutputScript(prevTx.outs[outpoint.index].script, Bitcoin.networks[this.identity.wallet.network]).toString();
            if (outAddress === walletAddress.address) {
                inputs.push({index: i, address: walletAddress.address, outpoint: outpoint });
            }
        }
    }
    return inputs;
};

/**
 * Undo the effects of the transaction on the wallet
 */
// was undoTransaction
Transaction.prototype.undo = function(tx, row) {
    var wallet = this.identity.wallet;
    var txHash = tx.getId();
    tx.ins.forEach(function(anIn) {
        var index = Bitcoin.bufferutils.reverse(anIn.hash).toString('hex') + ':' + anIn.index;
        var output = wallet.wallet.outputs[index];
        // If output.spendheight is > 0 means the transaction is a double spend
        if (output && output.spend && !output.spendheight) {
            if (!output.spendpending) {
                var walletAddress = wallet.getWalletAddress(output.address);
                walletAddress.balance += output.value;
            }
            output.clearSpend();
        }
    });
    tx.outs.forEach(function(anOut, i) {
        var index = txHash + ':' + i;
        var output = wallet.wallet.outputs[index];
        if (output) {
            delete wallet.wallet.outputs[index];
            if (output.counted) {
                var walletAddress = wallet.getWalletAddress(output.address);
                walletAddress.balance -= output.value;
            }
        }
    });

    // also remove the transaction from tasks
    var task = this.identity.tasks.search('send', 'hash', txHash);
    if (task) {
        this.identity.tasks.removeTask('send', task);
    }
    // TODO: Row should be found automatically if not provided...
    if (row) {
        var historyIndex = this.identity.history.history.indexOf(row);
        if (historyIndex > -1) {
            this.identity.history.history.splice(historyIndex, 1);
        }
    }
    // And remove the transaction from our cache
    if (Object.keys(this.identity.txdb.transactions).indexOf(txHash) > -1) {
        delete this.identity.txdb.transactions[txHash];
    }
    this.identity.store.save();
};


/**
 * Process incoming transaction
 * @param {String} serializedTx  Transaction in hexadecimal
 * @param {Number} height        Height of the block that the transaction was mined
 * @return {Object} DOCME
 */
// was processTx
Transaction.prototype.process = function(serializedTx, height) {
    var wallet = this.identity.wallet;
    var tx = Bitcoin.Transaction.fromHex(serializedTx);
    var txHash = tx.getId();

    // Allow the bitcoinjs wallet to process the tx
    if (!this.identity.txdb.getBody(txHash)) {
        // don't run if we already processed the transaction since
        // otherwise bitcoinjs-lib will reset 'pending' attribute.

        // store in our tx db
        this.identity.txdb.storeTransaction(txHash, serializedTx);
    }

    // Now parse inputs and outputs
    tx.outs.forEach(function(txOut, i){
      var outType = Bitcoin.scripts.classifyOutput(txOut.script, Bitcoin.networks[wallet.versions.network]);
      // don't process output if not of the right type or has no value
      if (!outType || outType === 'nulldata' || !txOut.value) {
          return;
      }
      var address = Bitcoin.Address.fromOutputScript(txOut.script, Bitcoin.networks[wallet.versions.network]).toString();
      var outputAddress = wallet.getWalletAddress(address);
      // already exists
      if (outputAddress) {
          wallet.processOutput(outputAddress, txHash, i, txOut.value, height);
      }
    });

    tx.ins.forEach(function(txIn, i){
      var op = txIn;
      var o = wallet.wallet.outputs[Bitcoin.bufferutils.reverse(op.hash).toString('hex')+':'+op.index];
      if (o) {
        o.markSpend(txHash+':'+i, height);
        if (height) {
            if (o.spendpending) {
                var inputAddress = wallet.getWalletAddress(o.address);
                o.spendpending = false;
                inputAddress.balance -= o.value;
            } 
        }
      }
    });


    // process in history (updates history rows)
    return this.identity.history.txFetched(serializedTx, height);
};

return Transaction;
});
