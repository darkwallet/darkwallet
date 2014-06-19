'use strict';

define(['bitcoinjs-lib', 'model/pocket/base'], function(Bitcoin, BasePocket) {

/**
 * Hierarchical Deterministic Pocket functionality.
 * @param {Object} store Store for the object.
 * @param {Object} pockets Pockets parent object
 * @constructor
 */
function HdPocket(store, pockets) {
    BasePocket.call(this, pockets);
    this.store = store;
    this.init();
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
 * Add an address to its pocket
 * @param {Object} walletAddress Address we're adding. See {@link Wallet#getWalletAddress}.
 */
HdPocket.prototype.addToPocket = function(walletAddress) {
    if (walletAddress.index[0]%2 === 1) {
        this.changeAddresses.push(walletAddress.address);
    } else {
        this.addresses.push(walletAddress.address);
    }
};

return HdPocket;
});
