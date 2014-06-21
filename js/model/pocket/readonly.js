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
    if (!data.address || data.type === 'stealth') {
        return;
    }
    var seq = ['readonly:'+this.name, data.address];
    var walletAddress = this.getMyWallet().pubKeys[seq];
    if (!walletAddress) {
        walletAddress = {
                        'index': seq,
                        'label': data.label || data.address,
                        'type': 'readonly',
                        'address': data.address,
                        'balance': 0,
                        'nOutputs': 0,
                        'height': 0,
                        'pubKey': false };

        // Add to Wallet
        this.getMyWallet().addToWallet(walletAddress);
    }
    return walletAddress;
};

/**
 * Remove an address from the pocket and wallet.
 */
ReadOnlyPocket.prototype.removeAddress = function(address) {
    var wallet = this.getMyWallet();
    var seq = ['readonly:'+this.name, address];
    var walletAddress = wallet.pubKeys[seq];
    if (walletAddress) {
        wallet.deleteAddress(seq, true);
    }
    var idx = this.addresses.indexOf(address);
    if (idx > -1) {
        this.addresses.splice(idx, 0);
    }
    return walletAddress;
}

/**
 * Destroy this pocket and cleanup all related addresses.
 */
ReadOnlyPocket.prototype.destroy = function() {
    var self = this;
    var pocketId = this.name;
    var wallet = this.getMyWallet();
    // First delete all addresses
    var addresses = this.getAllAddresses();
    var removed = [];
    addresses.forEach(function(address) {
        var walletAddress = self.removeAddress(address);
        if (walletAddress) {
            removed.push(walletAddress);
        }
    });
    // Now delete our index in the wallet
    delete wallet.pockets.pockets.readonly[pocketId];
    this.addresses = [];
    return removed;
}

/**
 * Create a read only addresses into this pocket from the given contact
 */
ReadOnlyPocket.prototype.fromContact = function(contact) {
    var self = this;
    var created = [];
    // Now add all keys
    contact.pubKeys.forEach(function(pubKey) {
        var walletAddress = self.createAddress(pubKey);
        if (walletAddress) {
            created.push(walletAddress);
        }
    });
    return created;
};

ReadOnlyPocket.prototype.getMainAddress = function() {
    return this.getMyWallet().getWalletAddress(this.addresses[0]);
    
};

return ReadOnlyPocket;
});
