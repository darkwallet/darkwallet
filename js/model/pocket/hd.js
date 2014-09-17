'use strict';

define(['bitcoinjs-lib', 'model/pocket/base'], function(Bitcoin, BasePocket) {

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
HdPocket.prototype.types = [undefined, 'stealth'];
HdPocket.prototype.autoCreate = true;

/**
 * Get the index for some address in this pocket
 */
HdPocket.prototype.getIndex = function(walletAddress) {
    return Math.floor(walletAddress.index[0]/2);
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
    return wallet.getAddress([index*2]);
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
    var wallet = this.getMyWallet();
    wallet.pockets.hdPockets[pocketId] = null;
    return destroyed;
};

/**
 * Custom addToPocket so we treat pocket address in a special
 * way.
 */
HdPocket.prototype.addToPocket = function(walletAddress) {
    // TODO: think a more elegant way to manage the pocket key
    // (that origins the stealth address).
    // The problem is the key belongs to the pocket but we don't
    // want to make its address 'public'.
    if (walletAddress.index.length > 1) {
        this.addresses.push(walletAddress.address);
        this.walletAddresses.push(walletAddress);
    }
};

/**
 * Get a free address
 */
HdPocket.prototype.getFreeAddress = function(change, label) {
    var walletAddress;
    // normal address, get the address
    var branchIndex = this.getPocketId()*2;
    if (change) {
        branchIndex += 1;
    }
    var n = 0;
    do {
        walletAddress = this.getMyWallet().getAddress([branchIndex, n], label);
        n += 1;
    } while (walletAddress.nOutputs > 0);

    // This should have no type
    if (walletAddress.type) {
       throw new Error("Generated an incorrect change address");
    }
    return walletAddress;
};

return HdPocket;
});
