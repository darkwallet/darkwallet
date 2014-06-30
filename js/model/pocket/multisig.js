'use strict';

define(['bitcoinjs-lib', 'model/pocket/base'], function(Bitcoin, BasePocket) {

/**
 * Multisig Pocket functionality.
 * @param {Object} store Store for the object.
 * @param {Object} pockets Pockets parent object
 * @constructor
 */
function MultisigPocket(store, pockets) {
    BasePocket.call(this, pockets);
    this.init(store);
}

MultisigPocket.prototype = Object.create(BasePocket.prototype);

// Pocket definition
MultisigPocket.prototype.type = 'multisig';
MultisigPocket.prototype.types = ['multisig'];
MultisigPocket.prototype.autoCreate = true;

/**
 * Initialize the pocket's internal structures.
 */
MultisigPocket.prototype.init = function(store) {
    var address = store.id;
    var multisig = this.getMyWallet().multisig.search({ address: address });
    if (!multisig) {
        // TODO: Create a fake fund for now
        multisig = {address: address, name: address};
        console.log("No fund for this address!", address);
    }
    this.multisig = multisig;
    this.store = store;
    this.name = multisig.name;
}

/**
 * Get the index for some address in this pocket
 */
MultisigPocket.prototype.getIndex = function(walletAddress) {
    return walletAddress.index[0];
};

/**
 * Get our index
 */
MultisigPocket.prototype.getPocketId = function() {
    return this.multisig.address;
};

/**
 * Get a free address
 */
MultisigPocket.prototype.getFreeAddress = function(change, label) {
    return this.walletAddresses[0];
};

return MultisigPocket;
});
