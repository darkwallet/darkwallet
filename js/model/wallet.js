'use strict';

define(['util/stealth', 'bitcoinjs-lib', 'model/multisig', 'model/pockets', 'util/btc'],
function(Stealth, Bitcoin, MultisigFunds, Pockets, BtcUtils) {
/**
 * Access to the identity bitcoin keys.
 * @param {Object} store Store for the object.
 * @param {Object} identity Identity for the object.
 * @constructor
 */
function Wallet(store, identity) {
    this.identity = identity;
    this.store = store;
    this.network = store.init('network', 'bitcoin');
    this.initVersions(this.network);
    this.is_cold = store.get('is_cold');
    this.fee = store.init('fee', 10000); // 0.1 mBTC
    this.pubKeys = store.init('pubkeys', {});
    this.scanKeys = store.init('scankeys', []);
    this.idKeys = store.init('idkeys', []);

    this.mpk = store.get('mpk');

    // internal bitcoinjs-lib wallet to keep track of utxo (for now)
    this.pockets = new Pockets(store, identity, this)
    this.wallet = new Bitcoin.Wallet(this.mpk);
    this.multisig = new MultisigFunds(store, identity, this);

    this.loadPubKeys();

    // store balance
    this.balance = this.getBalance();
};

Wallet.prototype.initVersions = function(network) {
    network = (network == 'bitcoin') ? 'mainnet' : network;
    this.versions = {
        address: Bitcoin.network[network].addressVersion,
        p2sh: Bitcoin.network[network].p2shVersion,
        hd: Bitcoin.network[network].hdVersions
    };
    switch(network) {
        case 'mainnet':
            this.versions.stealth = {address: Stealth.version, nonce: Stealth.nonceVersion};
            break;
        case 'testnet':
            // TODO: NON STANDARD!!
            this.versions.stealth = {address: 42, nonce: Stealth.nonceVersion};
            break;
    }
}

/**
 * Initialize addresses for the wallet if empty
 */
Wallet.prototype.initIfEmpty = function() {
    var self = this;
    // If empty generate two addresses and one change for each initial pocket
    if (!Object.keys(this.pubKeys).length) {
        this.pockets.hdPockets.forEach(function (pocket, i) {
            self.getAddress([i*2,0]);
            self.getAddress([i*2,1]);
            self.getAddress([(i*2)+1,0]);
        });
        self.store.save();
    };
};

/**
 * Get balance for a specific pocket or all pockets
 * @param {String|undefined} pocket Pocket number or all pockets if undefined
 * @param {Number} Balance in satoshis
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
                balance += out.value;
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
    var balances = {confirmed: balance, unconfirmed: unconfirmed};
    
    if (pocketIndex === undefined) {
        this.balance = balances;
    }
    return balances;
};

/**
 * Load wallet addresses into internal Bitcoin.Wallet
 * @private
 */
Wallet.prototype.loadPubKeys = function() {
    var self = this;
    Object.keys(this.pubKeys).forEach(function(index) {
        var walletAddress = self.pubKeys[index];

        // Add all to the wallet
        self.wallet.addresses.push(walletAddress.address);
        if (walletAddress.index.length > 1) {
            self.pockets.addToPocket(walletAddress);

            // TODO: Don't process previous history so we can cache
            // properly later
            if (walletAddress.history) {
                  // Reload history
                  walletAddress.balance = 0;
                  walletAddress.nOutputs = 0;
                  walletAddress.height = 0;
                  self.processHistory(walletAddress, walletAddress.history, true);
            }
        }
    });
    return false; // updated
};

Wallet.prototype.deriveHDPrivateKey = function(seq, masterKey) {
    var key = masterKey;
    var workSeq = seq.slice(0);
    while(workSeq.length) {
        key = key.derive(workSeq.shift());
    }
    return key.priv;
};

Wallet.prototype.deriveStealthPrivateKey = function(seq, masterKey, keyStore) {
    var spendKey;
    var scanKey = this.getScanKey();
    var privData = keyStore.privKeys[seq.slice(0,1)];
    if (privData) {
        spendKey = new Bitcoin.ECKey(privData, true);
    } else {
        // stealth address take the spend key from the pocket 0
        spendKey = this.deriveHDPrivateKey(seq.slice(0,1), masterKey);
    }
    return Stealth.uncoverPrivate(scanKey.toBytes(), seq.slice(2), spendKey.toBytes());
};


/**
 * Get the private key for the given address index
 * @param {Array} seq Array for the bip32 sequence to retrieve address for
 * @param {String} password Password to encrypt the private data
 * @param {Function} callback A callback where the private key will be provided.
 */
Wallet.prototype.getPrivateKey = function(seq, password, callback) {
    // clone seq since we're mangling it
    var data = this.store.getPrivateData(password);
    if (data.privKeys[seq]) {
        var key = new Bitcoin.ECKey(data.privKeys[seq], true);
        callback(key);
        return;
    }
    var masterKey = Bitcoin.HDWallet.fromBase58(data.privKey);
    var privKey;
    if (seq.length > 1 && seq[1] == 's') {
        privKey = this.deriveStealthPrivateKey(seq, masterKey, data);
    } else {
        privKey = this.deriveHDPrivateKey(seq, masterKey);
        this.storePrivateKey(seq, password, privKey);
    }
   
    callback(privKey);
};

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
};

/**
 * Store the given public key as a wallet address
 * @param {Array} seq Address sequence (bip32 or stealth id)
 * @param {Bitcoin.ECKey} key Bitcoin.ECKey or public key bytes
 * @return {Object} the wallet address
 */
Wallet.prototype.storePublicKey = function(seq, key, properties) {
    var pubKey = key.length ? key : key.toBytes();

    var pubKeyHash = Bitcoin.crypto.hash160(pubKey);
    var address = new Bitcoin.Address(pubKeyHash, this.versions.address);

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
       'height': 0,
       'pubKey': pubKey,
       'address': address.toString()
    };

    // Merge properties
    if (properties) {
        for (var attrname in properties) {
            walletAddress[attrname] = properties[attrname];
        }
    }

    // Precalculate stealth address and mpk for pockets (only main branch)
    if ((seq.length == 1) && (seq[0]%2 == 0)) {
        // Stealth
        var scanKey = this.getScanKey();
        var stealthAddress = Stealth.formatAddress(scanKey.getPub().toBytes(), [pubKey], this.versions.stealth.address);
        walletAddress['stealth'] = stealthAddress;
        // Mpk
        walletAddress['mpk'] = BtcUtils.deriveMpk(this.mpk, seq[0])
    }

    // add to internal bitcoinjs-lib wallet
    this.addToWallet(walletAddress);
    return walletAddress;
};

/**
 * Add an address to the wallet
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}.
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
 * @throws {Error} When generated an incorrect change address.
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
 * @return {Object} The first change address
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
 *   
 * @param {String} address Bitcoin address
 * @return {Object} The wallet address structure
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
 * @return {Object} List of outputs
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
 * 
 * @param {String} pocketId DOCME
 * @param {Object[]} recipients DOCME
 * @param {Object} changeAddress DOCME
 * @param {Number} fee Fee for that transaction 
 * @return {Object} The transaction object with the following fields:
 *   - tx
 *   - utxo
 *   - total
 *   - fee
 *   - change
 *   - myamount
 *   - stealth
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
            address = Stealth.addStealth(address, newTx, self.versions.address, self.versions.stealth.nonce);
        }
        newTx.addOutput(address, recipient.amount);
    });

    // Calculate change
    var change = outAmount - (totalAmount + fee);
    if (change) {
        newTx.addOutput(changeAddress.address, change);
    }
    // Return the transaction and some metadata
    return {tx: newTx, utxo: txUtxo, total: totalAmount, fee: fee, change: change, myamount: outAmount, stealth: isStealth, recipients: recipients};
};

/**
 * Sign given transaction outputs
 * @param {Object} newTx DOCME
 * @param {Object} txUtxo DOCME
 * @param {String} password DOCME
 * @param {Function} callback DOCME
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
 * @param {Object[]} inputs DOCME
 * @param {Object} newTx DOCME
 * @param {String} password Password to decrypt the private keys
 * @return {Boolean} If signed or not
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
 * See Bitcoin.Wallet.processOutput
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}
 * @param {String} txHash
 * @param {String} index
 * @param {Number} value
 * @param {Number} height
 * @param {Object} spend
 */
Wallet.prototype.processOutput = function(walletAddress, txHash, index, value, height, spend, spendheight) {
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
        walletAddress.nOutputs += 1;
    }
    // If confirmed and not spent add balance
    if (height && !output.height && !spend) {
        walletAddress.balance += value;
    }
    if (walletAddress.type == 'stealth') {
        output.stealth = true;
    }
    // Save height
    if (!output.height) {
        output.height = height;
    }

    // If it's a spend save the next output and spend height
    if (spend) {
        output.spend = spend;
        output.spendheight = spendheight;
    }
};

/*
 * Check if transaction involves given address.
 * Returns an array with involved inputs
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}
 * @param {Object} tx             
 * @return {Object[]}
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
            // XXX temporary while bitcoinjs-lib supports testnet better
            prevTx = BtcUtils.fixTxVersions(prevTx, identity);

            if (prevTx.outs[outpoint.index].address == walletAddress.address) {
                inputs.push({index: i, address: walletAddress.address, outpoint: outpoint});
            }
        }
    };
    return inputs;
};


/**
 * Process incoming transaction
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}
 * @param {String} serializedTx  Transaction in hexadecimal
 * @param {Number} height        Height of the block that the transaction was mined
 * @return {Object} DOCME
 */
Wallet.prototype.processTx = function(walletAddress, serializedTx, height) {
    var self = this;
    var tx = new Bitcoin.Transaction(serializedTx);
    var txHash = Bitcoin.convert.bytesToHex(tx.getHash());

    // Allow the bitcoinjs wallet to process the tx
    if (!this.identity.txdb.transactions.hasOwnProperty(txHash)) {
        // don't run if we already processed the transaction since
        // otherwise bitcoinjs-lib will reset 'pending' attribute.

        // store in our tx db
        this.identity.txdb.storeTransaction(txHash, serializedTx);
    }

    // XXX temporary while bitcoinjs-lib supports testnet better
    tx = BtcUtils.fixTxVersions(tx, this.identity);

    // Now parse inputs and outputs
    tx.outs.forEach(function(txOut, i){
      var address = txOut.address.toString();
      var outputAddress = self.getWalletAddress(address);
      // already exists
      if (outputAddress) {
          self.processOutput(outputAddress, txHash, i, txOut.value, height);
      }
    });

    tx.ins.forEach(function(txIn, i){
      var op = txIn.outpoint
      var o = self.wallet.outputs[op.hash+':'+op.index];
      if (o) {
        o.spend = txHash+':'+i;
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
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}
 * @param {Array} history
 */
Wallet.prototype.processHistory = function(walletAddress, history, initial) {
    var self = this;

    // only supported getting (and caching) all history for now
    walletAddress.history = history;

    // process history
    history.forEach(function(tx) {
        // sum unspent outputs for the address
        var outTxHash = tx[0];
        var inTxHash = tx[4];
        var outHeight = tx[2];
        var spend;
        if (inTxHash == null) {
            if (outHeight) {
                walletAddress.height = Math.max(outHeight, walletAddress.height);
            }
        } else {
            spend = inTxHash + ":" + tx[5];
        }
        // pass on to internal Bitcoin.Wallet
        self.processOutput(walletAddress, tx[0], tx[1], tx[3], outHeight, spend, tx[6]);
    });
    if (!initial) {
        this.store.save();
    }
};

/**
 * Get the stealth scanning ECKey
 * @return {Object} The scanning key
 */
Wallet.prototype.getScanKey = function() {
    var scanMaster = this.scanKeys[0];
    var scanMasterKey = Bitcoin.HDWallet.fromBase58(scanMaster.priv);
    return scanMasterKey.priv;
};

/**
 * Get the identity ECKey
 * @param {Number} n key index
 * @return {Object} The scanning key
 */
Wallet.prototype.getIdentityKey = function(n) {
    n = n || 0;
    var idMaster = this.idKeys[0];
    var idMasterKey = Bitcoin.HDWallet.fromBase58(idMaster.priv);
    var childKey = idMasterKey.derive(n);
    return childKey.priv;
};


/**
 * Process stealth array from obelisk.
 * The array comes 
 * @param {Object[]} stealthArray DOCME
 */
Wallet.prototype.processStealth = function(stealthArray) {
    var self = this;
    var matches = [];
    stealthArray.forEach(function(stealthData) {
        var ephemKey = Bitcoin.convert.hexToBytes(stealthData[0]);
        var address = stealthData[1];
        var txId = stealthData[2];
        var scanKey = self.getScanKey();

        // for now checking just the first stealth address derived from pocket 0 "default"
        var spendKey = self.getAddress([0]).pubKey;
        var myKeyBytes = Stealth.uncoverPublic(scanKey.toBytes(), ephemKey, spendKey);
        // Turn to address
        var myKeyHash = Bitcoin.crypto.hash160(myKeyBytes);
        var myAddress = new Bitcoin.Address(myKeyHash, self.versions.address);

        if (address == myAddress.toString()) {
            var seq = [0, 's'].concat(ephemKey);
            var walletAddress = self.getAddress(seq);
            if (!walletAddress) {
                walletAddress = self.storePublicKey(seq, myKeyBytes, {'type': 'stealth', 'ephemKey': ephemKey, 'address': address});
            }
            console.log('stealth detected', walletAddress);
            if (!walletAddress.ephemKey) {
                walletAddress.ephemKey = ephemKey;
                walletAddress.type = 'stealth';
                walletAddress.address = address;
                self.store.save();
            }
            matches.push(walletAddress);
        }
    });
    return matches;
};

return Wallet;
});
