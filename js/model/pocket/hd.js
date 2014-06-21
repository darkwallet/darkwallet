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
    return wallet.getAddress([index]);
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
    var i = this.getPocketId();
    var wallet = this.getMyWallet();
    wallet.pockets.hdPockets[i] = null;
    return destroyed;
};


return HdPocket;
});
