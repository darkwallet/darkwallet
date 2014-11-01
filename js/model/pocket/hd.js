'use strict';

define(['bitcoinjs-lib', 'model/pocket/base', 'util/stealth', 'util/btc'], function(Bitcoin, BasePocket, Stealth, BtcUtils) {

/**
 * Hierarchical Deterministic Pocket functionality.
 * @param {Object} store Store for the object.
 * @param {Object} pockets Pockets parent object
 * @constructor
 */
function HdPocket(store, pockets) {
    this.store = store;
    BasePocket.call(this, pockets);
    this.name = store.name;
    this.mainAddress = null;
}

HdPocket.prototype = Object.create(BasePocket.prototype);

// Pocket definition
HdPocket.prototype.type = 'hd';
HdPocket.prototype.types = [undefined, 'hd', 'pocket', 'stealth', 'oldstealth'];
HdPocket.prototype.autoCreate = true;

/**
 * Get the index for some address in this pocket
 */
HdPocket.prototype.getIndex = function(walletAddress, walletVersion) {
    if ([undefined, 'oldstealth'].indexOf(walletAddress.type) > -1 || walletVersion < 5) {
        return Math.floor(walletAddress.index[0]/2);
    } else {
        return walletAddress.index[0];
    }
};

/**
 * Get the main address for this pocket
 */
HdPocket.prototype.getMainAddress = function() {
    var wallet = this.getMyWallet();
    var index = wallet.pockets.hdPockets.indexOf(this.store);
    if (index === -1) {
        throw new Error("Wrong hd pocket!");
    }
    if (this.getMyWallet().store.get('version') > 4) {
        return wallet.getAddress([index]);
    } else {
        return wallet.getAddress([index*2]);
    }
};

/**
 * Get our index
 */
HdPocket.prototype.getPocketId = function() {
    var wallet = this.getMyWallet();
    return wallet.pockets.hdPockets.indexOf(this.store);
}

/**
 * Custom destroy to also cleanup the internal hdPocket
 */
HdPocket.prototype.destroy = function() {
    // First cleanup using the base class
    var destroyed = BasePocket.prototype.destroy.call(this);

    // Now do specific hd pocket cleaning
    var pocketId = this.getPocketId();
    var pockets = this.getMyWallet().pockets.hdPockets;
    pockets[pocketId] = null;
    while(pockets.length>0 && !pockets[pockets.length-1]) {
        pockets.pop();
    }
    return destroyed;
};

/**
 * Custom addToPocket so we treat pocket address in a special
 * way.
 */
HdPocket.prototype.addToPocket = function(walletAddress) {
    // We store pocket addresses as well as normal receiving addresses,
    // The pocket address is the one used to derive the stealth address,
    // and normally shouldn't receive funds and the user shouldn't see
    // it.
    // At the moment we leave it to the gui not to show the address
    // to the user and make it invisible.
    this.addresses.push(walletAddress.address);
    this.walletAddresses.push(walletAddress);

    // Add pocket specific metadata to the address
    // needed here in addition to createAddress since some
    // metadata was not being added before
    this.addPocketMetadata(walletAddress);
};

HdPocket.prototype.addPocketMetadata = function(walletAddress) {
    var wallet = this.getMyWallet();
    var seq = walletAddress.index;
    // Precalculate stealth address and mpk for pockets (only main branch)
    if ((seq.length === 1) && (this.getMyWallet().store.get('version') > 4 || seq[0]%2 === 0)) {
        // Stealth, do this always in case it needs to be upgraded
        var scanKey = wallet.getScanKey(seq[0]);
        var stealthAddress = Stealth.formatAddress(scanKey.pub.toBytes(), [walletAddress.pubKey], wallet.versions.stealth.address);
        walletAddress.stealth = stealthAddress;
        // Mpk
        if (!walletAddress.mpk) {
            walletAddress.mpk = BtcUtils.deriveMpk(wallet.mpk, seq[0]);
        }
    }

}

/**
 * Create an address from the seq number
 */
HdPocket.prototype.createAddress = function(seq, label) {
    var wallet = this.getMyWallet();
    // derive from mpk
    var mpKey = Bitcoin.HDNode.fromBase58(wallet.mpk);

    // clone seq since we're mangling it
    var workSeq = seq.slice(0);
    // derive key seq
    var childKey = mpKey;
    while(workSeq.length) {
        childKey = childKey.derive(workSeq.shift());
    }
    var properties = {};
    var version = this.getMyWallet().store.get('version');
    // set type
    if (version > 4) {
        // XXX should we do pocket with seq === 1 or seq === 2
        var properties = { type: ((seq.length === 1) ? 'pocket' : 'hd') };
    }
    // set label
    if (label) {
        properties.label = label;
    } else if (seq.length === 1) {
        label = 'pocket';
    } else if (version > 4 || seq[0] %2 === 1) {
        label = 'change';
    } else {
        label = 'unused';
    }

    // storePublicKey will call pocket.addToPocket, that will call addPocketMetadata
    var walletAddress = wallet.storePublicKey(seq, childKey.pubKey, properties);
    return walletAddress;
}

/**
 * Get a free address
 */
HdPocket.prototype.getFreeAddress = function(change, label) {
    var walletAddress;
    // normal address, get the address
    var n = 0;
    do {
        if (this.getMyWallet().store.get('version') > 4) {
            walletAddress = this.getMyWallet().getAddress([this.getPocketId(), change, n], label);
        } else {
            var branchIndex = this.getPocketId()*2;
            if (change) {
                branchIndex += 1;
            }
            walletAddress = this.getMyWallet().getAddress([branchIndex, n], label);
        }
        n += 1;
    } while (walletAddress.nOutputs > 0);

    // This should have no type
    if (walletAddress.type) {
       throw new Error("Generated an incorrect change address");
    }
    return walletAddress;
};

/**
 * Key derivation
 */
HdPocket.prototype.deriveHDPrivateKey = function(seq, masterKey) {
    var key = masterKey;
    // clone seq since we're mangling it
    var workSeq = seq.slice(0);
    while(workSeq.length) {
        key = key.derive(workSeq.shift());
    }
    return key.privKey;
};

HdPocket.prototype.deriveStealthPrivateKey = function(seq, masterKey, keyStore) {
    var spendKey;
    var scanKey = this.getMyWallet().getScanKey(seq[0]);
    var privData = keyStore.privKeys[seq.slice(0,1)];
    if (privData) {
        spendKey = Bitcoin.ECKey.fromBytes(privData, true);
    } else {
        // stealth address take the spend key from the pocket 0
        spendKey = this.deriveHDPrivateKey(seq.slice(0,1), masterKey);
    }
    return Stealth.uncoverPrivate(scanKey.toBytes(), seq.slice(2), spendKey.toBytes());
};

HdPocket.prototype.getPrivateKey = function(walletAddress, password, keyStore, callback) {
    var seq = walletAddress.index;
    var masterKey = Bitcoin.HDNode.fromBase58(keyStore.privKey);
    var privKey;
    if (walletAddress.type === 'stealth') {
        privKey = this.deriveStealthPrivateKey(seq, masterKey, keyStore);
    } else if (walletAddress.type === 'oldstealth') {
        // TODO: This can be either new or old key...
        masterKey = Bitcoin.HDNode.fromBase58(keyStore.oldPrivKey);
        privKey = this.deriveStealthPrivateKey(seq, masterKey, keyStore);
    } else if (['hd', 'pocket'].indexOf(walletAddress.type) > -1) {
        privKey = this.deriveHDPrivateKey(seq, masterKey);
        this.getMyWallet().storePrivateKey(seq, password, privKey);
    } else {
        if (this.getMyWallet().store.get('version') > 4) {
            masterKey = Bitcoin.HDNode.fromBase58(keyStore.oldPrivKey);
        }
        privKey = this.deriveHDPrivateKey(seq, masterKey);
        this.getMyWallet().storePrivateKey(seq, password, privKey);
    }

    callback(privKey);
};

/****************
 * Pocket specific functions
 */

/**
 * Get the master private key for a pocket's branch (public or change)
 */
HdPocket.prototype.getMasterKey = function(change, password) {
    var wallet = this.getMyWallet();
    var data = wallet.store.getPrivateData(password);
    var masterKey = Bitcoin.HDNode.fromBase58(data.privKey);
    if (this.getMyWallet().store.get('version') > 4) {
        return masterKey.derive(this.getPocketId()).toBase58(true);
    } else {
        return masterKey.derive((this.getPocketId()*2)+change).toBase58(true);
    }
};


return HdPocket;
});
