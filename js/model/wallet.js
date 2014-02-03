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
    this.mpk = store.get('mpk');
    if (!this.mpk) {
         console.log("Wallet without mpk!", this.mpk);
    }
    this.store = store;
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
        return this.pubKeys[addrId];
    }
}

/**
 * Send bitcoins from this wallet.
 * XXX preliminary... needs storing more info here or just use bitcoinjs-lib api
 */
Wallet.prototype.sendBitcoins = function(recipient, changeAddress, amount, fee, utxo, password) {
    // prepare some parameters
    var txHash = utxo.hash;
    var outIndex = utxo.index;
    var outAmount = utxo.amount;
    var outAddress = utxo.address;

    // now prepare transaction
    var newTx = new Bitcoin.Transaction();
    // add inputs
    newTx.addInput(txHash, outIndex);
    var change = outAmount - (amount + fee);

    // add outputs
    newTx.addOutput(recipient, amount);
    newTx.addOutput(changeAddress.address, change);

    console.log("sending:", recipient ,"change", change, "sending", amount+fee, "utxo", utxo.amount);

    // might need to sign several inputs
    var pocket, n;
    if (utxo.address.index) {
        pocket = utxo.address.index[0];
        n = utxo.address.index[1];
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

