'use strict';

define([], function() {

/**
 * Base Pocket functionality.
 * @param {Object} pockets Pockets parent object
 * @constructor
 */
function BasePocket(pockets) {
    this.getMyWallet = function() {
        return pockets.wallet;
    };
    this.walletAddresses = [];
    this.addresses = [];
    this.balance = 0;
}

/**
 * Add an address to its pocket
 * @param {Object} walletAddress Address we're adding. See {@link Wallet#getWalletAddress}.
 */
BasePocket.prototype.addToPocket = function(walletAddress) {
    this.addresses.push(walletAddress.address);
    this.walletAddresses.push(walletAddress);
};

/**
 * Remove an address from the pocket and wallet.
 */
BasePocket.prototype.removeAddress = function(walletAddress) {
    var wallet = this.getMyWallet();
    wallet.deleteAddress(walletAddress.index);
    var i = this.walletAddresses.indexOf(walletAddress);
    if (i>0) {
        this.walletAddresses.splice(i, 1);
        if (this.addresses[i] !== walletAddress.address) {
            // consistency must be maintained
            throw new Error("pocket index mismatch!");
        }
        this.addresses.splice(i, 1);
    }

    return walletAddress;
}

/**
 * Gets wallet address for the given address
 * @return {Array} An array of strings with the addresses.
 */
BasePocket.prototype.getWalletAddress = function(address) {
    var idx = this.addresses.indexOf(address);
    if (idx > -1) {
        return this.walletAddresses[idx];
    }
};


/**
 * Gets all public addresses for this pocket.
 * @return {Array} An array of walletAddress structures
 */
BasePocket.prototype.getWalletAddresses = function() {
    return this.walletAddresses;
};


/**
 * Gets all public addresses for this pocket as strings.
 * @return {Array} An array of strings with the addresses.
 */
BasePocket.prototype.getAddresses = function() {
    return this.addresses;
};

/**
 * Gets the pocket wallet for a pocket
 * @return {Object} The pocket wallet
 */
BasePocket.prototype.getWallet = function() {
    // Generate on the fly
    var outputs = this.getMyWallet().wallet.outputs;
    var addresses = this.getAddresses();
    var pocketOutputs = {};
    Object.keys(outputs).forEach(function(outputKey) {
        var output = outputs[outputKey];
        if (addresses.indexOf(output.address) != -1) {
            pocketOutputs[outputKey] = output;
        }
    });
    return { outputs: pocketOutputs, addresses: addresses };
};

/**
 * Get the main address for this pocket
 */
BasePocket.prototype.getMainAddress = function() {
    return this.walletAddresses[0];
};

/**
 * Destroy this pocket and cleanup all related addresses.
 * Also unlinks the pocket from the wallet
 */
BasePocket.prototype.destroy = function() {
    var self = this;
    var wallet = this.getMyWallet();
    // First delete all addresses
    var walletAddresses = this.getWalletAddresses();
    var removed = [];
    walletAddresses.forEach(function(walletAddress) {
        if (walletAddress) {
            self.removeAddress(walletAddress);
            removed.push(walletAddress);
        }
    });
    // Now delete our index in the wallet
    var pocketId = this.getPocketId();
    delete wallet.pockets.pockets[this.type][pocketId];
    this.addresses = this.addresses.splice(0, this.addresses.length);
    wallet.store.save();
    return removed;
};

BasePocket.prototype.getChangeAddress = function(label) {
    return this.getFreeAddress(true, label);
};

return BasePocket;
});
