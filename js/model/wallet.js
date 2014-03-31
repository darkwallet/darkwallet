/*
 * @fileOverview Access to the identity bitcoin keys
 */

define(['darkwallet', 'util/stealth', 'bitcoinjs-lib', 'model/multisig', 'sjcl'],
function(DarkWallet, Stealth, Bitcoin, MultisigFunds) {
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
    this.pockets = store.init('pockets', ['default']);
    this.pocketWallets = {}
    for(var idx=0; idx< this.pockets.length; idx++) {
        this.initPocket({addresses: [], balance: 0})
    };
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
            // don't add fund addresses to total funds
            if (this.pubKeys[keys[idx]].type != 'multisig') {
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
    if (this.pockets.indexOf(name) == -1) {
        this.pockets.push(name);
        this.store.save();
        this.initPocket(this.pockets.length-1);
    }
}

/**
 * Initialize a pocket
 */
Wallet.prototype.initPocket = function(idx) {
    this.pocketWallets[idx] = {addresses: [], balance: 0};
}

/**
 * Delete a pocket
 */
Wallet.prototype.deletePocket = function(name) {
    var idx = this.pockets.indexOf(name);
    this.pockets[idx] = null;
    this.store.save();
    // TODO: Cleanup pocket addresses?
}


/**
 * Rename a pocket
 * @param {String} oldName Old name of the pocket
 * @param {String} newName New name for the pocket
 */
Wallet.prototype.renamePocket = function(oldName, newName) {
    var i = this.pockets.indexOf(oldName);  
    if (i >= 0) {
        this.pockets[i] = newName;
        this.store.save();
    }
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
        var key = Bitcoin.Key(data.privKeys[seq]);
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
Wallet.prototype.storeAddress = function(seq, key) {
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

    var stealth = Stealth.getStealthAddress(mpPubKey);

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
       'stealth': Bitcoin.base58.checkEncode(stealth.slice(1), 6),
       'address': address.toString()
    };

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

/**
 * Broadcast transaction
 */
Wallet.prototype.broadcastTx = function(newTx, isStealth, callback) {
    // Broadcasting
    console.log("send tx", newTx);
    console.log("send tx", newTx.serializeHex());
    var notifyTx = function(error, count) {
        if (error) {
            console.log("Error sending tx: " + error);
            callback({data: error, text: "Error sending tx"})
            return;
        }
        console.log("tx radar: " + count);
    }
    if (isStealth) {
        console.log("not broadcasting stealth tx yet...");
    } else {
        // DarkWallet.getClient().broadcast_transaction(newTx.serializeHex(), notifyTx)
    }
    callback(null)
}

Wallet.prototype.getPocketWallet = function(idx) {
    // Generate on the fly
    var outputs = this.wallet.outputs;
    var addresses = this.pocketWallets[idx].addresses;
    var pocketOutputs = [];
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
    } else {
        tmpWallet = this.getPocketWallet(pocketIdx);
    }
    return tmpWallet.getUtxoToPay(value);
}

/**
 * Send bitcoins from this wallet.
 * XXX preliminary... needs storing more info here or just use bitcoinjs-lib api
 */
Wallet.prototype.sendBitcoins = function(pocketIdx, recipients, changeAddress, fee, password, callback) {
    var self = this;
    var totalAmount = 0;
    recipients.forEach(function(recipient) {
        totalAmount = recipient.amount;
    })
    var isStealth = false;
    // find an output with enough funds
    var txUtxo;
    try {
        txUtxo = this.getUtxoToPay(totalAmount+fee, pocketIdx);
    } catch(e) {
        callback({text: 'Not enough funds', data: e})
        return;
    }

    // Create an empty transaction
    var newTx = new Bitcoin.Transaction();

    // Compute total utxo value for this tx
    // Also add inputs
    var outAmount = 0;
    txUtxo.forEach(function(utxo) {
        outAmount += utxo.value;
        newTx.addInput(utxo.output);
    });

    // Calculate change
    var change = outAmount - (totalAmount + fee);

    // Add inputs
    recipients.forEach(function(recipient) {
        var address = recipient.address;
        // test for stealth
        if (address[0] == 'S') {
            isStealth = true;
            address = Stealth.addStealth(address, newTx);
        }
        newTx.addOutput(address, recipient.amount);
    })

    if (change) {
        newTx.addOutput(changeAddress.address, change);
    }

    var pending = [];

    // Signing
    var errors = false;
    for(var idx=0; idx<txUtxo.length; idx++) {
        var seq;
        var utxo = txUtxo[idx];
        var outAddress = self.getWalletAddress(utxo.address);
        if (outAddress) {
            seq = outAddress.index;
        } else {
            errors = true;
            callback({data: utxo.address, text: "This address is not managed by the wallet!"})
            return;
        }
        if (outAddress.type == 'multisig') {
            pending.push({output: utxo.output, address: utxo.address, index: idx})
        } else {
          // Get private keys and sign
          try {
            self.getPrivateKey(seq, password, function(outKey) {
                newTx.sign(idx, outKey);
            });
          } catch (e) {
            callback({data: e, text: "Password incorrect!"})
            return;
          }
        }
    };
    if (pending) {
        // If pending signatures add task and callback with 2nd parameter
        var task = {tx: newTx.serializeHex(), 'pending': pending, stealth: isStealth};
        this.identity.tasks.addTask('multisig', task)
        callback(null, task)
    } else if (!errors) {
        // Else, just broadcast
        this.broadcastTx(newTx, isStealth, callback);
    }
}

/**
 * Process an output from an external source
 * @see Bitcoin.Wallet.processOutput
 */
Wallet.prototype.processOutput = function(walletAddress, output) {
    // Wallet wide
    this.wallet.processOutput(output);

    // Pocket specific wallet
    // this.pocketWallets[walletAddress.index[0]].processOutput(output);
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
        walletAddress.nOutputs += 1;
        if (inTxHash == null) {
            walletAddress.balance += tx[3];
            walletAddress.height = Math.max(tx[2], walletAddress.height);
        }
        // pass on to internal Bitcoin.Wallet
        self.processOutput(walletAddress, { output: tx[0]+":"+tx[1], value: tx[3], address: walletAddress.address });
    });
    this.store.save();
}


/**
 * Process stealth array from obelisk.
 * The array comes 
 */
Wallet.prototype.processStealth = function(stealthArray, password) {
    var self = this;
    stealthArray.forEach(function(stealthData) {
        var nonceArray = Bitcoin.convert.hexToBytes(stealthData[0]);
        var ephemkey = Bitcoin.convert.hexToBytes(stealthData[0]);
        var address = stealthData[1];
        var txId = stealthData[2];

        // for now checking just the first stealth address derived from pocket 0 "default"
        self.getPrivateKey([0], password, function(privKey) {
            var stAddr = Stealth.uncoverStealth(privKey.export('bytes'), ephemkey);
            if (address == stAddr.getBitcoinAddress().toString()) {
                console.log("STEALTH MATCH!!");
                var seq = [0, 's'].concat(ephemkey);
                var walletAddress = self.storeAddress(seq, stAddr);
                walletAddress.type = 'stealth';
                walletAddress.ephemkey = ephemkey;
                self.store.save();
                self.storePrivateKey(seq, password, stAddr);
            }
        });
    });
}

return Wallet;
});
