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
 * Custom destroy to also cleanup the internal hdPocket
 */
HdPocket.prototype.destroy = function() {
    // Backwards compatibility while cleaning up:
    var name = this.name;
    var wallet = this.getMyWallet();
    var hdPockets = wallet.pockets.hdPockets;
    var i = hdPockets.indexOf(this.store);
    if (i > -1) {
        hdPockets[i] = null;
    } else {
        throw new Error("Backend does not exist!");
    }
    BasePocket.prototype.destroy.call(this);
};


return HdPocket;
});
