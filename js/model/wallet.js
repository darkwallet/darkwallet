/*
 * @fileOverview Access to the identity bitcoin keys
 */

define(['util/stealth', 'bitcoinjs-lib', 'model/multisig'],
function(Stealth, Bitcoin, MultisigFunds) {
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
    this.pockets = this.initPockets(store)
    this.mpk = store.get('mpk');
    if (!this.mpk) {
         console.log("Wallet without mpk!", this.mpk);
    }
    // internal bitcoinjs-lib wallet to keep track of utxo (for now)
    this.wallet = new Bitcoin.Wallet(this.mpk);
    this.multisig = new MultisigFunds(store, identity, this);

    // store balance
    this.loadPubKeys();
    this.balance = this.getBalance();
}

Wallet.prototype.initPockets = function(store) {
    var pockets = store.init('pockets', [{name:'default'}, {name: 'savings'}]);

    // Upgrade pocket store to new format
    if (typeof pockets[0] == 'string') {
        for(var i=0; i< pockets.length; i++) {
            pockets[i] = {'name': pockets[i]};
        };
    }
    // Init pocket wallets (temporary cache for pockets)
    this.pocketWallets = [];
    for(var idx=0; idx< pockets.length; idx++) {
        this.initPocket(idx);
    };
    return pockets;
}

/**
 * Get balance for a specific pocket or all pockets
 * @param {String or undefined} pocket Pocket number or all pockets if undefined
 */
Wallet.prototype.getBalance = function(pocketIndex) {
    var balance = 0;
    var allAddresses = [];
    var keys = Object.keys(this.pubKeys);
    if (pocketIndex === undefined) {
        for(var idx=0; idx<keys.length; idx++) {
            // don't add fund or readonly addresses to total funds
            if (['multisig', 'readonly'].indexOf(this.pubKeys[keys[idx]].type) == -1) {
                allAddresses.push(this.pubKeys[keys[idx]]);
            }
        }
    } else {
        for(var idx=0; idx<keys.length; idx++) {
            var walletAddress = this.pubKeys[keys[idx]];
            if (walletAddress.index && walletAddress.index[0] == pocketIndex) {
                allAddresses.push(walletAddress);
           }
        }
    }
    allAddresses.forEach(function(walletAddress) {
        balance += walletAddress.balance;
    });
    if (pocketIndex === undefined) {
        this.balance = balance;
    }
    return balance;
}

/**
 * Create pocket with the given name
 * @param {String} name Name for the new pocket
 */
Wallet.prototype.createPocket = function(name) {
    // Raise exception if name exists
    if (this.getPocket(name)) {
        throw Error("Pocket with that name already exists!");
    }
    this.pockets.push({name: name});
    this.store.save();
    this.initPocket(this.pockets.length-1);
}

/**
 * Initialize a pocket
 */
Wallet.prototype.initPocket = function(idx) {
    this.pocketWallets[idx] = {addresses: [], balance: 0};
}

/**
 * Get a pocket by name
 */
Wallet.prototype.getPocket = function(name) {
    for(var i=0; i<this.pockets.length; i++) {
        if (this.pockets[i].name == name) {
            return this.pockets[i];
        }
    }
}

/**
 * Delete a pocket
 */
Wallet.prototype.deletePocket = function(name) {
    for(var i=0; i<this.pockets.length; i++) {
        if (this.pockets[i].name == name) {
             this.pockets[i] = null;
             this.store.save();
             // TODO: Cleanup pocket addresses?
             return;
        }
    }
    throw Error("Pocket with that name does not exist!");
}

/**
 * Get the pocket index for a wallet address
 */
Wallet.prototype.getAddressPocketIdx = function(walletAddress) {
    if (walletAddress.type == 'multisig') {
        return walletAddress.index[0];
    } else {
        return Math.floor(walletAddress.index[0]/2);
    }
}

/**
 * Add an address to its pocket
 */
Wallet.prototype.addToPocket = function(walletAddress) {
    var pocketIdx = this.getAddressPocketIdx(walletAddress);

    // add to the list of pocket addresses
    if (!this.pocketWallets[pocketIdx]) {
        this.initPocket(pocketIdx)
    }
    this.pocketWallets[pocketIdx].addresses.push(walletAddress.address);
}

/**
 * Add an address to the wallet
 */
Wallet.prototype.addToWallet = function(walletAddress) {
    this.wallet.addresses.push(walletAddress.address);
    this.pubKeys[walletAddress.index.slice()] = walletAddress;
    this.addToPocket(walletAddress);
    this.store.save();
}

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
            self.addToPocket(walletAddress);

            if (walletAddress.history)
                self.processHistory(walletAddress, walletAddress.history);
        }
    });
    // Cleanup malformed addresses
    toRemove.forEach(function(index) {
        console.log("[model] Deleting", self.pubKeys[index])
        delete self.pubKeys[index];
    })
}

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
        var key = new Bitcoin.Key(data.privKeys[seq], true);
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
 * @param {Bitcoin.Key} key Private key to store
 */
Wallet.prototype.storePrivateKey = function(seq, password, key) {
    var self = this;
    seq = seq.slice(0);
    var data = this.store.getPrivateData(password);
    data.privKeys[seq] = key.export('bytes');
    this.store.setPrivateData(data, password);
}

/**
 * Store the given public address
 * @param {Array} seq Address sequence (bip32 or stealth id)
 * @param {Bitcoin.Key} key Bitcoin.Key or public key bytes
 */
Wallet.prototype.storeAddress = function(seq, key, properties) {
    // BIP32 js support is still missing some part and we can't get addresses
    // from pubkey yet, unless we do it custom like here...:
    // (mpKey.key.getBitcoinAddress doesn't work since 'key' is not a key
    // object but binary representation).
    var mpPubKey, label;
    if (key.length) {
        mpPubKey = key;
    } else {
        mpPubKey = key.toBytes();
    }
    var mpKeyHash = Bitcoin.Util.sha256ripe160(mpPubKey);
    var address = new Bitcoin.Address(mpKeyHash);

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
       'pubKey': mpPubKey,
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
        var stealthAddress = Stealth.formatAddress(scanKey.getPub().toBytes(), [mpPubKey]);
        walletAddress['stealth'] = stealthAddress;
    }

    // add to internal bitcoinjs-lib wallet
    this.addToWallet(walletAddress);
    return walletAddress;
}

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
        return this.storeAddress(seq, childKey.pub);
    }
}

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
}

/**
 * Set the default fee
 * @param {String} The new fee in satoshis
 */
Wallet.prototype.setDefaultFee = function(newFee) {
    this.fee = newFee;
    this.store.set('fee', newFee);
    this.store.save();
    console.log("[wallet] saved new fees", newFee);
}

Wallet.prototype.getPocketWallet = function(idx) {
    // Generate on the fly
    var outputs = this.wallet.outputs;
    var addresses = this.pocketWallets[idx].addresses;
    var pocketOutputs = {};
    Object.keys(outputs).forEach(function(outputKey) {
        var output = outputs[outputKey];
        if (addresses.indexOf(output.address.toString()) != -1) {
            pocketOutputs[outputKey] = output;
        }
    })
    var tmpWallet = new Bitcoin.Wallet(this.mpk)
    tmpWallet.outputs = pocketOutputs;
    tmpWallet.addresses = addresses;
    return tmpWallet;
}

Wallet.prototype.getUtxoToPay = function(value, pocketIdx) {
    var outputs = this.wallet.outputs;
    var tmpWallet;
    if (pocketIdx == 'all') {
        tmpWallet = this.wallet;
    } else if(typeof pocketIdx === 'number') {
        tmpWallet = this.getPocketWallet(pocketIdx);
    } else {
        throw new Error('invalid parameter');
    }
    return tmpWallet.getUtxoToPay(value);
}

/**
 * Prepare a transaction with the given constraints
 * XXX preliminary... needs storing more info here or just use bitcoinjs-lib api
 */
Wallet.prototype.prepareTx = function(pocketIdx, recipients, changeAddress, fee) {
    var self = this;
    var totalAmount = 0;
    recipients.forEach(function(recipient) {
        totalAmount += recipient.amount;
    })
    var isStealth = false;

    // find outputs with enough funds
    var txUtxo;
    try {
        txUtxo = this.getUtxoToPay(totalAmount+fee, pocketIdx);
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
        newTx.addInput(utxo.output);
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
    })

    // Calculate change
    var change = outAmount - (totalAmount + fee);
    if (change) {
        newTx.addOutput(changeAddress.address, change);
    }
    // Return the transaction and some metadata
    return {tx: newTx, utxo: txUtxo, total: totalAmount, fee: fee, change: change, myamount: outAmount, stealth: isStealth};
}

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
            pending.push({output: utxo.output, address: utxo.address, index: idx, signatures: [], type: outAddress?outAddress.type:'signature'});
        } else {
          // Get private keys and sign
          try {
            this.getPrivateKey(seq, password, function(outKey) {
                newTx.sign(idx, outKey);
            });
          } catch (e) {
            callback({data: e, message: "Password incorrect!"})
            return;
          }
        }
    };
    // No error so callback with success
    callback(null, pending);
}

/**
 * Process an output from an external source
 * @see Bitcoin.Wallet.processOutput
 */
Wallet.prototype.processOutput = function(walletAddress, txHash, index, value, height, spend) {
    var output = { output: txHash+":"+index, value: value, address: walletAddress.address};
    if (!height) {
        output.pending = true;
    }
    if (spend) {
        output.spend = spend;
    }
    // Wallet wide
    this.wallet.processOutput(output);

    // Pocket specific wallet
    // this.pocketWallets[walletAddress.index[0]].processOutput(output);
}

/*
 * Check if transaction involves given address.
 */
Wallet.prototype.txForAddress = function(walletAddress, tx) {
    var isMine = false;
    var identity = this.identity;
    // Maybe we could just check if we have the outpoints here instead of
    // looking for the address (but we don't have per address outpoint lists yet...).
    for(var i=0; i<tx.ins.length; i++) {
        var outpoint = tx.ins[i].outpoint;
        var txHash = outpoint.hash;
         if (identity.txdb.transactions.hasOwnProperty(txHash)) {
            var prevTx = new Bitcoin.Transaction(identity.txdb.transactions[txHash]);
            if (prevTx.outs[outpoint.index].address == walletAddress.address) {
                return true;
            }
        }
    };
    return isMine;
}


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
        this.wallet.processTx(tx, height)

        // store in our tx db
        this.identity.txdb.storeTransaction(txHash, serializedTx)
    }

    // process in history (updates walletAddress balance and confirms outputs pending status)
    return this.identity.history.txFetched(walletAddress, serializedTx, height)
}

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
}

/**
 * Get the stealth scanning ECKey
 */
Wallet.prototype.getScanKey = function() {
    var scanMaster = this.scanKeys[0];
    var scanMasterKey = Bitcoin.HDWallet.fromBase58(scanMaster.priv);
    return scanMasterKey.priv;
}

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
        var myKeyHash = Bitcoin.Util.sha256ripe160(myKeyBytes);
        var myAddress = new Bitcoin.Address(myKeyHash);

        if (address == myAddress.toString()) {
            console.log("STEALTH MATCH!!");
            var seq = [0, 's'].concat(ephemKey);
            var walletAddress = self.storeAddress(seq, myKeyBytes, {'type': 'stealth', 'ephemkey': ephemKey});
        }
    });
}

return Wallet;
});
