/*
 * @fileOverview Access to the identity bitcoin keys
 */

define(['util/stealth', 'bitcoinjs-lib', 'model/multisig', 'model/pockets'],
function(Stealth, Bitcoin, MultisigFunds, Pockets) {
/**
 * Wallet class.
 * @param {Object} store Store for the object.
 * @constructor
 */
function Wallet(store, identity) {
    this.identity = identity;
    this.store = store;
    this.is_cold = store.get('is_cold');
    this.fee = store.init('fee', 10000); // 0.1 mBTC
    this.pubKeys = store.init('pubkeys', {});
    this.scanKeys = store.init('scankeys', []);
    if (this.scanKeys.length == 0) {
        console.log('You need to reseed the wallet to generate stealth scanning keys!');
    }
    this.mpk = store.get('mpk');
    if (!this.mpk) {
         console.log("Wallet without mpk!", this.mpk);
    }
    // internal bitcoinjs-lib wallet to keep track of utxo (for now)
    this.pockets = new Pockets(store, identity, this)
    this.wallet = new Bitcoin.Wallet(this.mpk);
    this.multisig = new MultisigFunds(store, identity, this);

    // store balance
    this.loadPubKeys();
    this.balance = this.getBalance();
}

/**
 * Get balance for a specific pocket or all pockets
 * @param {String or undefined} pocket Pocket number or all pockets if undefined
 */
Wallet.prototype.getBalance = function(pocketIndex) {
    var balance = 0;
    var unconfirmed = 0;
    var allAddresses = [];
    var keys = Object.keys(this.pubKeys);
    if (pocketIndex === undefined) {
        for(var i=0; i<keys.length; i++) {
            // don't add fund or readonly addresses to total funds
            if (['multisig', 'readonly'].indexOf(this.pubKeys[keys[i]].type) == -1) {
                allAddresses.push(this.pubKeys[keys[i]].address);
            }
        }
    } else {
        for(var i=0; i<keys.length; i++) {
            var walletAddress = this.pubKeys[keys[i]];
            if (walletAddress.index && walletAddress.index[0] == pocketIndex) {
                allAddresses.push(walletAddress.address);
           }
        }
    }
    // Get balance directly from available outputs
    var outputs = this.wallet.outputs;
    var keys = Object.keys(outputs);
    for(var i=0; i<keys.length; i++) {
        var out = outputs[keys[i]];
        if (allAddresses.indexOf(out.address) != -1) {
            if (out.spend && out.spendheight == 0) {
                unconfirmed -= out.value;
            } else if (out.spend) {
                // spent so don't count it
            } else if (!out.height) {
                unconfirmed += out.value;
            }
            else {
                balance += out.value;
            }
        }
    };
    /*allAddresses.forEach(function(walletAddress) {
        balance += walletAddress.balance;
    });*/
    if (pocketIndex === undefined) {
        this.balance = balance;
    }
    return {confirmed: balance, unconfirmed: unconfirmed};
};

/**
 * Load wallet addresses into internal Bitcoin.Wallet
 * @private
 */
Wallet.prototype.loadPubKeys = function() {
    var self = this;
    var toRemove = [];
    Object.keys(this.pubKeys).forEach(function(index) {
        var walletAddress = self.pubKeys[index];
        if (walletAddress == null || walletAddress.index == null) {
            toRemove.push(index)
            return;
        }
        // Add all to the wallet
        self.wallet.addresses.push(walletAddress.address);
        if (walletAddress.index.length > 1) {
            self.pockets.addToPocket(walletAddress);

            if (walletAddress.history)
                self.processHistory(walletAddress, walletAddress.history);
        }
    });
    // Cleanup malformed addresses
    toRemove.forEach(function(index) {
        console.log("[model] Deleting", self.pubKeys[index]);
        delete self.pubKeys[index];
    });
};

/**
 * Get the private key for the given address index
 * @param {Array} seq Array for the bip32 sequence to retrieve address for
 * @param {Function} callback A callback where the private key will be provided.
 */
Wallet.prototype.getPrivateKey = function(seq, password, callback) {
    // clone seq since we're mangling it
    var workSeq = seq.slice(0);
    var data = this.store.getPrivateData(password);
    if (data.privKeys[seq]) {
        var key = new Bitcoin.ECKey(data.privKeys[seq], true);
        callback(key);
        return;
    }
    var key = Bitcoin.HDWallet.fromBase58(data.privKey);
    while(workSeq.length) {
        key = key.derive(workSeq.shift());
    }
    this.storePrivateKey(seq, password, key.priv);
   
    callback(key.priv);
}

/**
 * Store the given private key
 * @param {Array} seq Address sequence (bip32 or stealth id)
 * @param {String} password Password to decrypt the private data
 * @param {Bitcoin.ECKey} key Private key to store
 */
Wallet.prototype.storePrivateKey = function(seq, password, key) {
    var self = this;
    seq = seq.slice(0);
    var data = this.store.getPrivateData(password);
    data.privKeys[seq] = key.toBytes();
    this.store.setPrivateData(data, password);
}

/**
 * Store the given public key as a wallet address
 * @param {Array} seq Address sequence (bip32 or stealth id)
 * @param {Bitcoin.ECKey} key Bitcoin.ECKey or public key bytes
 */
Wallet.prototype.storePublicKey = function(seq, key, properties) {
    var pubKey = key.length ? key : key.toBytes();

    var pubKeyHash = Bitcoin.crypto.hash160(pubKey);
    var address = new Bitcoin.Address(pubKeyHash);

    var label = 'unused';
    if (seq.length == 1) {
        label = 'pocket';
    } else if (seq.length > 1 && seq[0]%2 == 1) {
        label = 'change';
    } else {
        label = 'unused';
    }

    var walletAddress = {
       'index': seq.slice(0),
       'label': label,
       'balance': 0,
       'nOutputs': 0,
       'pubKey': pubKey,
       'address': address.toString()
    };

    // Merge properties
    if (properties) {
        for (var attrname in properties) {
            walletAddress[attrname] = properties[attrname];
        }
    }

    // Precalculate stealth address for pockets (even branches)
    if ((seq.length == 1) && (seq[0]%2 == 0)) {
        var scanKey = this.getScanKey();
        var stealthAddress = Stealth.formatAddress(scanKey.getPub().toBytes(), [pubKey]);
        walletAddress['stealth'] = stealthAddress;
    }

    // add to internal bitcoinjs-lib wallet
    this.addToWallet(walletAddress);
    return walletAddress;
};

/**
 * Add an address to the wallet
 */
Wallet.prototype.addToWallet = function(walletAddress) {
    this.wallet.addresses.push(walletAddress.address);
    this.pubKeys[walletAddress.index.slice()] = walletAddress;
    this.pockets.addToPocket(walletAddress);
    this.store.save();
};

/**
 * Get an address from this wallet.
 * @param {Array} seq Array for the bip32 sequence to retrieve address for
 */
Wallet.prototype.getAddress = function(seq) {
    if (this.pubKeys[seq]) {
        return this.pubKeys[seq];
    }
    else {
        // derive from mpk
        var mpKey = Bitcoin.HDWallet.fromBase58(this.mpk);

        var workSeq = seq.slice(0);
        var childKey = mpKey;
        while(workSeq.length) {
            childKey = childKey.derive(workSeq.shift());
        }
        return this.storePublicKey(seq, childKey.pub);
    }
};

/**
 * Get a free address from a branch id (can be pocket or pocket+1 for change)
 * @param {Array} seq Array for the bip32 sequence to retrieve address for
 */
Wallet.prototype.getFreeAddress = function(branchIndex) {
    var walletAddress;
    if (typeof branchIndex == 'string') {
        // multisig get the same address again
        walletAddress = this.getWalletAddress(branchIndex);
        if (walletAddress.type != 'multisig') {
           throw Error("Generated an incorrect change address");
        }
    } else {
        // normal address, get the address
        var n = 0;
        do {
            walletAddress = this.getAddress([branchIndex, n]);
            n += 1;
        } while (walletAddress.nOutputs > 0);

        // This should have no type
        if (walletAddress.type) {
           throw Error("Generated an incorrect change address");
        }
    }
    return walletAddress;
};

/**
 * Get a free change address for a pocket
 * @param {Object} pocketIndex Index for the pocket, can be string for
 *                 multisigs or int for a normal pocket (as usual).
 */

Wallet.prototype.getChangeAddress = function(pocketId) {
    var branchIndex;
    if (typeof pocketId == 'string') {
        branchIndex = pocketId;
    } else {
        // Change branch
        branchIndex = (pocketId*2)+1;
    }
    return this.getFreeAddress(branchIndex);
};

/**
 * Get the wallet address structure for an address.
 * The structure has the following fields:
 *   index: bip32 sequence
 *   label: label
 *   balance: satoshis
 *   nOutputs: number of outputs
 *   address: address hash
 */
Wallet.prototype.getWalletAddress = function(address) {
    var keys = Object.keys(this.pubKeys);
    for (var idx=0; idx<keys.length; idx++) {
         var walletAddress = this.pubKeys[keys[idx]];
         if (walletAddress.address == address) {
             return walletAddress;
         }
    }
};

/**
 * Set the default fee
 * @param {String} The new fee in satoshis
 */
Wallet.prototype.setDefaultFee = function(newFee) {
    this.fee = newFee;
    this.store.set('fee', newFee);
    this.store.save();
    console.log("[wallet] saved new fees", newFee);
};

/**
 * Get available unspent outputs for paying from the given pocket.
 * @param {Number} value The amount to look for in satoshis
 * @param {Object} pocketId The pocket identifier
 */
Wallet.prototype.getUtxoToPay = function(value, pocketId) {
    var outputs = this.wallet.outputs;
    var tmpWallet;
    if (pocketId == 'all') {
        tmpWallet = this.wallet;
    } else {
        tmpWallet = this.pockets.getPocketWallet(pocketId);
    }

    var getCandidateOutputs = function(w, value) {
        var h = []
        for (var out in w.outputs) h.push(w.outputs[out])
        // remove spent
        var utxo = h.filter(function(x) { return !x.spend });

        // remove unconfirmed
        utxo = utxo.filter(function(x) { return x.height });

        // organize and select
        var valuecompare = function(a,b) { return a.value > b.value; }
        var high = utxo.filter(function(o) { return o.value >= value; })
                       .sort(valuecompare);
        if (high.length > 0) return [high[0]];
        utxo.sort(valuecompare);
        var totalval = 0;
        for (var i = 0; i < utxo.length; i++) {
            totalval += utxo[i].value;
            if (totalval >= value) return utxo.slice(0,i+1);
        }
        throw ("Not enough money to send funds including transaction fee. Have: "
                     + (totalval / 100000000) + ", needed: " + (value / 100000000));
   }

   return getCandidateOutputs(tmpWallet, value);
};

/**
 * Prepare a transaction with the given constraints
 */
Wallet.prototype.prepareTx = function(pocketId, recipients, changeAddress, fee) {
    var self = this;
    var totalAmount = 0;
    recipients.forEach(function(recipient) {
        totalAmount += recipient.amount;
    });
    var isStealth = false;

    // find outputs with enough funds
    var txUtxo;
    try {
        txUtxo = this.getUtxoToPay(totalAmount+fee, pocketId);
    } catch(e) {
        if (typeof e == 'string') {
            // Errors from libbitcoin come as strings
            throw Error(e)
        } else {
            // Otherwise it must be a javascript error
            throw Error('Error sending: ' + e)
        }
    }

    // Create an empty transaction
    var newTx = new Bitcoin.Transaction();

    // Add Inputs
    // and compute total utxo value for this tx
    var outAmount = 0;
    txUtxo.forEach(function(utxo) {
        outAmount += utxo.value;
        newTx.addInput(utxo.receive);
    });

    // Add Outputs
    recipients.forEach(function(recipient) {
        var address = recipient.address;
        // test for stealth
        if (address[0] == '6') {
            isStealth = true;
            address = Stealth.addStealth(address, newTx);
        }
        newTx.addOutput(address, recipient.amount);
    });

    // Calculate change
    var change = outAmount - (totalAmount + fee);
    if (change) {
        newTx.addOutput(changeAddress.address, change);
    }
    // Return the transaction and some metadata
    return {tx: newTx, utxo: txUtxo, total: totalAmount, fee: fee, change: change, myamount: outAmount, stealth: isStealth};
};

/**
 * Sign given transaction outputs
 */
Wallet.prototype.signTransaction = function(newTx, txUtxo, password, callback) {
    var pending = [];

    // Signing
    for(var idx=0; idx<txUtxo.length; idx++) {
        var seq;
        var utxo = txUtxo[idx];
        var outAddress = this.getWalletAddress(utxo.address);
        if (outAddress) {
            seq = outAddress.index;
        }
        if (!outAddress || outAddress.type == 'multisig' || outAddress.type == 'readonly') {
            pending.push({output: utxo.receive, address: utxo.address, index: idx, signatures: {}, type: outAddress?outAddress.type:'signature'});
        } else {
          // Get private keys and sign
          try {
            this.getPrivateKey(seq, password, function(outKey) {
                newTx.sign(idx, outKey);
            });
          } catch (e) {
            callback({data: e, message: "Password incorrect!"});
            return;
          }
        }
    };
    // No error so callback with success
    callback(null, pending);
};

/*
 * Helper functions
 */
Wallet.prototype.signMyInputs = function(inputs, newTx, password) {
    var identity = this.identity;
    var signed = false;
    for(var i=0; i<newTx.ins; i++) {
        var anIn = newTx.ins[i];
        if (identity.txdb.transactions.hasOwnProperty(anIn.outpoint.hash)) {
            var prevTxHex = identity.txdb.transactions[anIn.outpoint.hash];
            var prevTx = new Bitcoin.Transaction(prevTxHex);
            var output = prevTx.out[anIn.outpoint.index];
            var walletAddress = identity.wallet.getWalletAddress(output.address);

            var found = inputs.filter(function(myIn, i) {
                return (myIn.hash == newIn.hash) && (myIn.index == newIn.index);
            });
            if (found.length == 1) {
                this.getPrivateKey(walletAddress.index, password, function(privKey) {
                    newTx.sign(i, privKey);
                    signed = true;
                });
            }
        } else {
            console.log("No wallet address for one of our addresses!");
        }
    }
    return signed;
};


/**
 * Process an output from an external source
 * @see Bitcoin.Wallet.processOutput
 */
Wallet.prototype.processOutput = function(walletAddress, txHash, index, value, height, spend) {
    // Wallet wide
    var output;
    var wallet = this.wallet;
    var outId = txHash+":"+index;
    var output = wallet.outputs[outId];
    // If it doesn't exist create a new one
    if (!output) {
        output = { receive: outId,
                   value: value,
                   address: walletAddress.address };
        wallet.outputs[outId] = output;
    }
    // If confirmed add balance
    if (height && !output.height) {
        walletAddress.balance += value;
    }
    // Save height
    output.height = height;

    // If it's a spend save the next output and spend height
    if (spend) {
        output.spend = spend;
        output.spendheight = height;
    }
};

/*
 * Check if transaction involves given address.
 * Returns an array with involved inputs
 */
Wallet.prototype.txForAddress = function(walletAddress, tx) {
    var identity = this.identity;
    // Maybe we could just check if we have the outpoints here instead of
    // looking for the address (but we don't have per address outpoint lists yet...).
    var inputs = [];
    for(var i=0; i<tx.ins.length; i++) {
        var outpoint = tx.ins[i].outpoint;
        var txHash = outpoint.hash;
         if (identity.txdb.transactions.hasOwnProperty(txHash)) {
            var prevTx = new Bitcoin.Transaction(identity.txdb.transactions[txHash]);
            if (prevTx.outs[outpoint.index].address == walletAddress.address) {
                inputs.push({index: i, address: walletAddress.address, outpoint: outpoint});
            }
        }
    };
    return inputs;
};


/**
 * Process incoming transaction
 */
Wallet.prototype.processTx = function(walletAddress, serializedTx, height) {
    var self = this;
    var tx = new Bitcoin.Transaction(serializedTx);
    var txHash = Bitcoin.convert.bytesToHex(tx.getHash());

    // Allow the bitcoinjs wallet to process the tx
    if (!this.identity.txdb.transactions.hasOwnProperty(txHash)) {
        // don't run if we already processed the transaction since
        // otherwise bitcoinjs-lib will reset 'pending' attribute.
        var txhash = Bitcoin.convert.bytesToHex(tx.getHash());

        // store in our tx db
        this.identity.txdb.storeTransaction(txHash, serializedTx);
    }

    // Now parse inputs and outputs
    tx.outs.forEach(function(txOut, i){
      var address = txOut.address.toString();
      var outputAddress = self.getWalletAddress(address);
      // already exists
      if (outputAddress) {
          processOutput(outputAddress, txhash, i, txOut.value, height);
      }
    });

    tx.ins.forEach(function(txIn, i){
      var op = txIn.outpoint
      var o = self.wallet.outputs[op.hash+':'+op.index];
      if (o) {
        o.spend = txhash+':'+i;
        o.spendheight = height;
        if (height) {
            if (o.spendpending && walletAddress.address == o.address) {
                o.spendpending = false;
                walletAddress.balance -= o.value;
            } 
        } else {
            o.spendpending = true;
        }
      }
    });


    // process in history (updates history rows)
    return this.identity.history.txFetched(walletAddress, serializedTx, height)
};

/**
 * Process history report from obelisk
 */
Wallet.prototype.processHistory = function(walletAddress, history) {
    var self = this;
    // reset some numbers for the address
    walletAddress.balance = 0;
    walletAddress.height = 0;
    walletAddress.nOutputs = 0;
    walletAddress.history = history;
    // process history
    history.forEach(function(tx) {
        // sum unspent outputs for the address
        var outTxHash = tx[0];
        var inTxHash = tx[4];
        var outHeight = tx[2];
        var spend;
        walletAddress.nOutputs += 1;
        if (inTxHash == null) {
            if (outHeight) {
                walletAddress.balance += tx[3];
                walletAddress.height = Math.max(outHeight, walletAddress.height);
            }
        } else {
            spend = inTxHash + ":" + tx[5];
        }
        // pass on to internal Bitcoin.Wallet
        self.processOutput(walletAddress, tx[0], tx[1], tx[3], outHeight, spend);
    });
    this.store.save();
};

/**
 * Get the stealth scanning ECKey
 */
Wallet.prototype.getScanKey = function() {
    var scanMaster = this.scanKeys[0];
    var scanMasterKey = Bitcoin.HDWallet.fromBase58(scanMaster.priv);
    return scanMasterKey.priv;
};

/**
 * Process stealth array from obelisk.
 * The array comes 
 */
Wallet.prototype.processStealth = function(stealthArray) {
    var self = this;
    stealthArray.forEach(function(stealthData) {
        var nonceArray = Bitcoin.convert.hexToBytes(stealthData[0]);
        var ephemKey = Bitcoin.convert.hexToBytes(stealthData[0]);
        var address = stealthData[1];
        var txId = stealthData[2];
        var scanKey = self.getScanKey();

        // for now checking just the first stealth address derived from pocket 0 "default"
        var spendKey = self.getAddress([0]).pubKey;
        var myKeyBytes = Stealth.uncoverStealth(scanKey.toBytes(), ephemKey, spendKey);
        // Turn to address
        var myKeyHash = Bitcoin.crypto.hash160(myKeyBytes);
        var myAddress = new Bitcoin.Address(myKeyHash);

        if (address == myAddress.toString()) {
            console.log("STEALTH MATCH!!");
            var seq = [0, 's'].concat(ephemKey);
            var walletAddress = self.storePublicKey(seq, myKeyBytes, {'type': 'stealth', 'ephemkey': ephemKey});
        }
    });
};

return Wallet;
});
