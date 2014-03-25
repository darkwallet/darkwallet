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
    this.store = store;
    this.is_cold = store.get('is_cold');
    this.fee = store.init('fee', 10000); // 0.1 mBTC
    this.pubKeys = store.init('pubkeys', {});
    this.pockets = store.init('pockets', ['default']);
    // clean up change pocket
    if (this.pockets.indexOf('change') != -1) {
        this.pockets.splice(this.pockets.indexOf('change'), 1);
    }
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
            if (walletAddress.index[0] == pocketIndex) {
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
    }
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
 * Load wallet addresses into internal Bitcoin.Wallet
 * @private
 */
Wallet.prototype.loadPubKeys = function() {
    var self = this;
    var toRemove = [];
    Object.keys(this.pubKeys).forEach(function(index) {
        if (self.pubKeys[index].index == null) {
            toRemove.push(index)
        }
        self.wallet.addresses.push(self.pubKeys[index].address);
        if (self.pubKeys[index].history)
            self.processHistory(self.pubKeys[index].address, self.pubKeys[index].history);
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
    var data = this.getPrivateData(password);
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
 * Get the decrypted private user data.
 * @param {String} password Password to decrypt the private data
 */
Wallet.prototype.getPrivateData = function(password) {
    var SHA256 = Bitcoin.Crypto.SHA256;
    var passwordDigest = Bitcoin.convert.wordArrayToBytes(SHA256(SHA256(SHA256(password))));
    passwordDigest = Bitcoin.convert.bytesToString(passwordDigest);
    var data = JSON.parse(sjcl.decrypt(passwordDigest, this.store.get('private')));
    if (!data.privKeys) {
        data.privKeys = {};
    }
    return data;
}

/**
 * Store the given private key
 * @param {Array} seq Address sequence (bip32 or stealth id)
 * @param {String} password Password to decrypt the private data
 * @param {Bitcoin.Key} key Private key to store
 */
Wallet.prototype.storePrivateKey = function(seq, password, key) {
    var data = this.getPrivateData(password);
    data.privKeys[seq] = key.export('bytes');
    var privData = Identity.encrypt(data, password);
    this.store.set('private', privData);
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

    this.pubKeys[seq] = {
       'index': seq,
       'label': label,
       'balance': 0,
       'nOutputs': 0,
       'pubKey': mpPubKey,
       'stealth': Bitcoin.base58.checkEncode(stealth.slice(1), 6),
       'address': address.toString()
    };
    this.store.save();
    // add to internal bitcoinjs-lib wallet
    this.wallet.addresses.push(address.toString());
    return this.pubKeys[seq];
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
 * Send bitcoins from this wallet.
 * XXX preliminary... needs storing more info here or just use bitcoinjs-lib api
 */
Wallet.prototype.sendBitcoins = function(recipient, changeAddress, amount, fee, password) {
    var isStealth = false;
    // find an output with enough funds
    var utxo = this.wallet.getUtxoToPay(amount+fee);
    if (utxo.length > 1) {
        console.log("several inputs not supported yet!");
        return;
    }
    // prepare some parameters
    var utxo1 = utxo[0];
    var outAmount = utxo1.value;

    // now prepare transaction
    var newTx = new Bitcoin.Transaction();
    // add inputs
    newTx.addInput(utxo1.output);
    var change = outAmount - (amount + fee);

    // test for stealth
    if (recipient[0] == 'S') {
        isStealth = true;
        recipient = Stealth.addStealth(recipient, newTx);
    }
    newTx.addOutput(recipient, amount);
    if (change) {
        newTx.addOutput(changeAddress.address, change);
    }

    console.log("sending:", recipient ,"change", change, "sending", amount+fee, "utxo", outAmount);

    // XXX Might need to sign several inputs
    var seq;
    var outAddress = this.getWalletAddress(utxo1.address);
    if (outAddress) {
        seq = outAddress.index;
    } else {
        console.log("This address is not managed by the wallet!");
        return;
    }
    if (outAddress.type == 'multisig') {
        console.log("Can't spend from multisig yet!");
        return;
    }
    // XXX should catch exception on bad password:
    //   sjcl.exception.corrupt {toString: function, message: "ccm: tag doesn't match"}
    this.getPrivateKey(seq, password, function(outKey) {
        newTx.sign(0, outKey);

        // XXX send transaction
        console.log("send tx", newTx);
        console.log("send tx", newTx.serializeHex());
        var notifyTx = function(error, count) {
            if (error) {
                console.log("Error sending tx: " + error);
                return;
            }
            console.log("tx radar: " + count);
        }
        if (isStealth) {
            console.log("not broadcasting stealth tx yet...");
        } else {
            DarkWallet.getClient().broadcast_transaction(newTx.serializeHex(), notifyTx)
        }
    });
}

/**
 * Process an output from an external source
 * @see Bitcoin.Wallet.processOutput
 */
Wallet.prototype.processOutput = function(output) {
    this.wallet.processOutput(output);
}

/**
 * Process history report from obelisk
 */
Wallet.prototype.processHistory = function(address, history) {
    var self = this;
    var walletAddress = this.getWalletAddress(address);
    if (!walletAddress) {
        console.log("no wallet record for", address);
        return;
    }
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
        self.processOutput({ output: tx[0]+":"+tx[1], value: tx[3], address: walletAddress.address });
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
