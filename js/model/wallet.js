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
 * @param {Integer} n Sequence number for the address.
 * @param {Boolean/Integer} pocket Pocket to use (pocket 0 is default, 1 is change, >2 are used defined).
 * @param {Function} callback A callback where the private key will be provided.
 */
Wallet.prototype.getPrivateKey = function(n, pocket, password, callback) {
    // XXX need to actually extract the appropriate private key here.
    var SHA256 = Bitcoin.Crypto.SHA256;
    var passwordDigest = SHA256(SHA256(SHA256( password )));
    var data = JSON.parse(sjcl.decrypt(passwordDigest, this.store.get('private')));
    var masterPrivateKey = new Bitcoin.BIP32key(data.privKey);
    callback(masterPrivateKey.ckd(pocket).ckd(n));
}

/**
 * Get an address from this wallet.
 * @param {Integer} n Sequence number for the address.
 * @param {Boolean/Integer} pocket Pocket to use (pocket 0 is default, 1 is change, >2 are used defined).
 */
Wallet.prototype.getAddress = function(n, pocket) {
    if (!pocket) {
        pocket = 0;
    }
    var addrId = [pocket, n];
    if (this.pubKeys[addrId]) {
        return this.pubKeys[addrId];
    }
    else {
        // derive from mpk
        var mpKey = new Bitcoin.BIP32key(this.mpk);

        // BIP32 js support is still missing some part and we can't get addresses
        // from pubkey yet, unless we do it custom like here...:
        // (mpKey.key.getBitcoinAddress doesn't work since 'key' is not a key
        // object but binary representation).
        var childKey = mpKey.ckd(pocket).ckd(n);
        var mpPubKey;
        if (childKey.key.length) {
            mpPubKey = childKey.key;
        } else {
            mpPubKey = Bitcoin.Util.sha256ripe160(childKey.key.getPub());
        }
        var mpKeyHash = Bitcoin.Util.sha256ripe160(mpPubKey);
        var address = new Bitcoin.Address(mpKeyHash);

        this.pubKeys[addrId] = {
           'index': [pocket, n],
           'label': 'unused',
           'balance': 0,
           'nOutputs': 0,
           'address': address.toString()
        };
        this.store.save();
        // add to internal bitcoinjs-lib wallet
        this.wallet.addresses.push(address.toString());
        return this.pubKeys[addrId];
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
    // find an output with enough funds
    var utxo = this.wallet.getUtxoToPay(amount+fee);
    // prepare some parameters
    var utxo1 = utxo[0];
    var txHash = utxo1.output.split(':')[0];
    var outIndex = parseInt(utxo1.output.split(':')[1]);
    var outAmount = utxo1.value;

    // now prepare transaction
    var newTx = new Bitcoin.Transaction();
    // add inputs
    newTx.addInput(txHash, outIndex);
    var change = outAmount - (amount + fee);

    // add outputs
    newTx.addOutput(recipient, amount);
    newTx.addOutput(changeAddress.address, change);

    console.log("sending:", recipient ,"change", change, "sending", amount+fee, "utxo", outAmount);

    // XXX Might need to sign several inputs
    var pocket, n;
    var outAddress = this.getWalletAddress(utxo1.address);
    if (outAddress) {
        var seq = outAddress.index;
        pocket = seq[0];
        n = seq[1];
    } else {
        // XXX testing only
        pocket = 0;
        n = 0;
    }
    // XXX should catch exception on bad password:
    //   sjcl.exception.corrupt {toString: function, message: "ccm: tag doesn't match"}
    this.getPrivateKey(n, pocket, password, function(outKey) {
        newTx.sign(0, outKey.key);

        // XXX send transaction
        console.log("send tx", newTx);
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
