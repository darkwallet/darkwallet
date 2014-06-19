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

/**
 * Create a read only address
 */
ReadOnlyPocket.prototype.createAddress = function(data) {
    var seq = ['readonly:'+this.name, pubKey.address];
    var oldAddress = this.getWallet().pubKeys[seq];
    if (!oldAddress) {
        var walletAddress = {
                        'index': seq,
                        'label': data.label || data.address,
                        'type': 'readonly',
                        'address': pubKey.address,
                        'balance': 0,
                        'nOutputs': 0,
                        'height': 0,
                        'pubKey': false };

        // Add to Wallet
        this.getWallet().addToWallet(walletAddress);
        return walletAddress;
    }
};

/**
 * Destroy this pocket and cleanup all related addresses.
 */
ReadOnlyPocket.prototype.destroy = function() {
    var pocketId = this.name;
    var wallet = this.getWallet();
    // First delete all addresses
    var addresses = pocket.getAllAddresses();
    addresses.forEach(function(address) {
        var seq = ['readonly:'+pocketId, address];
        if (wallet.pubKeys[seq]) {
            wallet.deleteAddress(seq, true);
        }
    });
    // Now delete our index in the wallet
    delete wallet.pockets.pockets.readonly[pocketId];
}

/**
 * Create a read only addresses into this pocket from the given contact
 */
ReadOnlyPocket.prototype.fromContact = function(contact) {
    var self = this;
    var created = [];
    // Now add all keys
    contact.pubKeys.forEach(function(pubKey) {
        if (pubKey.address && pubKey.type !== 'stealth') {
            var walletAddress = self.createAddress(pubKey);
            if (walletAddress) {
                created.push(walletAddress);
            }
        }
    });
    return created;
};


return ReadOnlyPocket;
});
