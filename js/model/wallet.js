/*
 * @fileOverview Access to the identity bitcoin keys
 */

/**
 * Wallet class.
 * @param {Object} store Store for the object.
 * @constructor
 */
function Wallet(store) {
    this.is_cold = store.get('is_cold');
    this.pubKeys = store.init('pubkeys', {});
    this.pockets = store.init('pockets', ['default', 'change']);
    this.mpk = store.get('mpk');
    if (!this.mpk) {
         console.log("Wallet without mpk!", this.mpk);
    }
    // internal bitcoinjs-lib wallet to keep track of utxo (for now)
    this.wallet = new Bitcoin.Wallet(this.mpk);
    this.store = store;
    this.loadPubKeys();
}

/**
 * Get balance for a specific pocket or all pockets
 * @param {String or undefined} pocket Pocket number or all pockets if undefined
 */
Wallet.prototype.getBalance = function(pocket) {
    var balance = 0;
    var allAddresses = [];
    var keys = Object.keys(this.pubKeys);
    if (pocket === undefined) {
        for(var idx=0; idx<keys.length; idx++) {
            allAddresses.push(this.pubKeys[keys[idx]]);
        }
    } else {
       var pocketIndex = this.pockets.indexOf(pocket);
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
 * Load wallet addresses into internal Bitcoin.Wallet
 * @private
 */
Wallet.prototype.loadPubKeys = function() {
    var self = this;
    Object.keys(this.pubKeys).forEach(function(index) {
        self.wallet.addresses.push(self.pubKeys[index].address);
    });
}

/**
 * Get the private key for the given address index
 * @param {Array} seq Array for the bip32 sequence to retrieve address for
 * @param {Function} callback A callback where the private key will be provided.
 */
Wallet.prototype.getPrivateKey = function(seq, password, callback) {
    // clone seq since we're mangling it
    var workSeq = seq.slice(0);
    var SHA256 = Bitcoin.Crypto.SHA256;
    var passwordDigest = SHA256(SHA256(SHA256( password )));
    var data = JSON.parse(sjcl.decrypt(passwordDigest, this.store.get('private')));
    var key = new Bitcoin.BIP32key(data.privKey);
    while(workSeq.length) {
        key = key.ckd(workSeq.shift());
    }
    callback(key);
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
        var mpKey = new Bitcoin.BIP32key(this.mpk);

        var workSeq = seq.slice(0);
        var childKey = mpKey;
        while(workSeq.length) {
            childKey = childKey.ckd(workSeq.shift());
        }
        // BIP32 js support is still missing some part and we can't get addresses
        // from pubkey yet, unless we do it custom like here...:
        // (mpKey.key.getBitcoinAddress doesn't work since 'key' is not a key
        // object but binary representation).
        var mpPubKey;
        if (childKey.key.length) {
            mpPubKey = childKey.key;
        } else {
            mpPubKey = childKey.key.getPub();
        }
        var mpKeyHash = Bitcoin.Util.sha256ripe160(mpPubKey);
        var address = new Bitcoin.Address(mpKeyHash);

        var stealth = this.getStealthAddress(mpPubKey);

        this.pubKeys[seq] = {
           'index': seq,
           'label': 'unused',
           'balance': 0,
           'nOutputs': 0,
           'pubKey': mpPubKey,
           'stealth': Bitcoin.base58.checkEncode(stealth).slice(1),
           'address': address.toString()
        };
        this.store.save();
        // add to internal bitcoinjs-lib wallet
        this.wallet.addresses.push(address.toString());
        return this.pubKeys[seq];
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
 * Send bitcoins from this wallet.
 * XXX preliminary... needs storing more info here or just use bitcoinjs-lib api
 */
Wallet.prototype.sendBitcoins = function(recipient, changeAddress, amount, fee, password) {
    // test for stealth
    var ephemKey;
    if (recipient[0] == 'S') {
        console.log("Stealth payment");
        var bytes = Bitcoin.base58.checkDecode('1'+recipient);
        var stealthData = this.initiateStealth(bytes.slice(0,33));
        recipient = stealthData[0].toString();
        ephemKey = stealthData[1];
    }
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

    // add outputs
    newTx.addOutput(recipient, amount);
    newTx.addOutput(changeAddress.address, change);
    if (ephemKey) {
        var ephemScript = new Bitcoin.Script();
        ephemScript.writeOp(Bitcoin.Opcode.map.OP_RETURN);
        ephemScript.writeBytes(Bitcoin.convert.hexToBytes('06deadbeef'+ephemKey));
        var stealthOut = new Bitcoin.TransactionOut({script: ephemScript});
        newTx.addOutput(stealthOut);
    }

    console.log("sending:", recipient ,"change", change, "sending", amount+fee, "utxo", outAmount);

    // XXX Might need to sign several inputs
    var pocket, n;
    var outAddress = this.getWalletAddress(utxo1.address);
    if (outAddress) {
        var seq = outAddress.index;
        pocket = seq[0];
        n = seq[1];
    } else {
        console.log("This address is not managed by the wallet!");
        return;
    }
    // XXX should catch exception on bad password:
    //   sjcl.exception.corrupt {toString: function, message: "ccm: tag doesn't match"}
    this.getPrivateKey([pocket, n], password, function(outKey) {
        newTx.sign(0, outKey.key);

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
        if (ephemKey) {
            console.log("not broadcasting stealth tx yet...");
        } else {
            DarkWallet.obeliskClient.client.broadcast_transaction(newTx.serializeHex(), notifyTx)
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
}

/**
 * Process stealth array from obelisk.
 * The array comes 
 */
Wallet.prototype.processStealth = function(stealthArray, password) {
    var self = this;
    stealthArray.forEach(function(stealthData) {
        var ephemkey = Bitcoin.convert.hexToBytes(stealthData[0]).slice(5);
        var address = stealthData[1];
        var txId = stealthData[2];

        // for now checking just the first stealth address derived from pocket 0 "default"
        self.getPrivateKey([0], password, function(privKey) {
            var stAddr = self.uncoverStealth(privKey.key.export('bytes'), ephemkey);
            if (address == stAddr.getBitcoinAddress().toString()) {
                console.log("STEALTH MATCH!!");
            }
        });
    });
}

/******************************************************
 * Methods related to stealth addresses.
 * Will be moved to another file and at the moment independent
 * from the rest of the class.
 */

/*
 * Create a bitcoin key with just public component.
 * @private
 */
Wallet.prototype.importPublic = function(Q) {
    //console.log('Q', Bitcoin.convert.bytesToHex(Q));
    var key = new Bitcoin.Key();
    delete key.priv;
    key.setPub(Q);
    return key;
}

/*
 * Perform curvedh and stealth formatting
 * @private
 */
Wallet.prototype.stealthDH = function(e, decKey) {
    // diffie hellman stage
    var point = decKey.getPubPoint().multiply(e);
    //console.log('pub point', decKey.getPubPoint().toString());
    //console.log('diffie point', point.toString());

    // start the second stage
    var S1 = [3].concat(point.getX().toBigInteger().toByteArrayUnsigned());
    //console.log('S1', Bitcoin.convert.bytesToHex(S1));
    var c = Bitcoin.Crypto.SHA256(S1, {asBytes: true});
    return c;
}


/*
 * Get the stealth address for a public key
 */
Wallet.prototype.getStealthAddress = function(mpPubKey) {
    var stealth = [6].concat(mpPubKey.concat([0,0,0,0,0]));
    return stealth;
}

/*
 * Generate a nonce and related address to send to for a stealth address
 * pubKey is bytes array
 */
Wallet.prototype.initiateStealth = function(pubKey) {
    // new magic key
    var encKey = new Bitcoin.Key();
    var nonce = encKey.getPubPoint().getEncoded(true);

    var decKey = this.importPublic(pubKey);
    var c = this.stealthDH(encKey.priv, decKey)

    // Now generate address
    var bytes = decKey.getPubPoint()
                          .add(new Bitcoin.Key(c).getPubPoint())
                          .getEncoded(true);
    // Turn to address
    var mpKeyHash = Bitcoin.Util.sha256ripe160(bytes);
    var address = new Bitcoin.Address(mpKeyHash);
    return [address, Bitcoin.convert.bytesToHex(nonce)]
}

/*
 * Generate key for receiving for a stealth address with a given nonce
 */
Wallet.prototype.uncoverStealth = function(masterSecret, nonce) {
    var ecN = new Bitcoin.BigInteger("115792089237316195423570985008687907852837564279074904382605163141518161494337");
    var priv = Bitcoin.BigInteger.fromByteArrayUnsigned(masterSecret);

    var decKey = this.importPublic(nonce);
    var c = this.stealthDH(priv, decKey)

    // Generate the specific secret for this keypair from our master
    var secretInt = priv
                        .add(Bitcoin.BigInteger.fromByteArrayUnsigned(c))
                        .mod(ecN)

    console.log('secretInt', secretInt.toString())

    // generate point in curve...
    var finalKey = new Bitcoin.Key(secretInt);
    finalKey.compressed = true;
    console.log(finalKey.getBitcoinAddress().toString());
    return finalKey;
}


/*
 * Some tests...
 */
Wallet.prototype.testFinishStealth = function(secret, nonce) {
    nonce = Bitcoin.convert.hexToBytes(nonce)
    secret = Bitcoin.convert.hexToBytes(secret)
    console.log(this.uncoverStealth(secret, nonce));
}

Wallet.prototype.testStealth = function(address) {
    var bytes = Bitcoin.base58.checkDecode('1'+address);
    console.log(this.initiateStealth(bytes.slice(0,33)));
}
