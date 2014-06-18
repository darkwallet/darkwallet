'use strict';

define(['bitcoinjs-lib', 'model/pocket/base'], function(Bitcoin, BasePocket) {

/**
 * Multisig Pocket functionality.
 * @param {Object} store Store for the object.
 * @param {Object} pockets Pockets parent object
 * @constructor
 */
function MultisigPocket(multisig, pockets) {
    this.multisig = multisig;
    BasePocket.call(this, pockets);
}

MultisigPocket.prototype = Object.create(BasePocket.prototype);

// Pocket definition
MultisigPocket.prototype.type = 'multisig';
MultisigPocket.prototype.types = ['multisig'];
MultisigPocket.prototype.autoCreate = true;

/**
 * Get the index for some address in this pocket
 */
MultisigPocket.prototype.getIndex = function(walletAddress) {
    return walletAddress.index[0];
};


/**
 * Initialize a pockets wallet
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 * @private
 */
MultisigPocket.prototype.init = function(id) {
    this.addresses.push(this.multisig.address);
};

/**
 * Add an address to its pocket
 * @param {Object} walletAddress Address we're adding. See {@link Wallet#getWalletAddress}.
 */
MultisigPocket.prototype.addToPocket = function(walletAddress) {
    if (!walletAddress.address === this.multisig.address) {
        throw new Error("Can't add to multisig pocket");
    }
};

return MultisigPocket;
});
