'use strict';

define(['bitcoinjs-lib', 'model/pocket/base'], function(Bitcoin, BasePocket) {

/**
 * Read Only pocket for watching addresses
 * @param {Object} store Store for the object.
 * @param {Object} pockets Pockets parent object
 * @constructor
 */
function ReadOnlyPocket(store, pockets) {
    BasePocket.call(this, pockets);
    this.store = store;
    this.name = store.id;
}

ReadOnlyPocket.prototype = Object.create(BasePocket.prototype);

// Pocket definition
ReadOnlyPocket.prototype.type = 'readonly';
ReadOnlyPocket.prototype.types = ['readonly'];
ReadOnlyPocket.prototype.autoCreate = true;
// Mark as read only
ReadOnlyPocket.prototype.readOnly = true;

/**
 * Get the index for some address in this pocket
 */
ReadOnlyPocket.prototype.getIndex = function(walletAddress) {
    // indexes are like 'r', pocketIndex
    return walletAddress.index[0].split(":")[1];
};

/**
 * Add an address to its pocket
 * @param {Object} walletAddress Address we're adding. See {@link Wallet#getWalletAddress}.
 */
ReadOnlyPocket.prototype.addToPocket = function(walletAddress) {
    this.addresses.push(walletAddress.address);
};

return ReadOnlyPocket;
});
