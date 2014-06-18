'use strict';

define([], function() {

/**
 * Hierarchical Deterministic Pocket functionality.
 * @param {Object} store Store for the object.
 * @param {Object} pockets Pockets parent object
 * @constructor
 */
function BasePocket(pockets) {
    this.getMyWallet = function() {
        return pockets.wallet;
    };
    this.addresses = [];
    this.changeAddresses = [];
    this.balance = 0;
    this.init();
}

/**
 * Initialize a pockets wallet
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 * @private
 */
BasePocket.prototype.init = function(id) {
};

/**
 * Add an address to its pocket
 * @param {Object} walletAddress Address we're adding. See {@link Wallet#getWalletAddress}.
 */
BasePocket.prototype.addToPocket = function(walletAddress) {
    throw new Error("Not implemented!");
};


/**
 * Gets all public addresses for this pocket.
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 * @return {Array} An array of strings with the addresses.
 */
BasePocket.prototype.getAddresses = function() {
    return this.addresses;
};

/**
 * Gets all change addresses for this pocket.
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 * @return {Array} An array of strings with the addresses.
 */
BasePocket.prototype.getChangeAddresses = function() {
    return this.changeAddresses;
};

/**
 * Gets all addresses for this pocket.
 * @param {Object} id Pocket id (can be pocket index, multisig address...)
 * @return {Array} An array of strings with the addresses.
 */
BasePocket.prototype.getAllAddresses = function() {
    return this.getAddresses().concat(this.getChangeAddresses());
};


/**
 * Gets the pocket wallet for a pocket
 * @param {Object} id Pocket id (can be pocket index, multisig address...)
 * @return {Object} The pocket wallet
 */
BasePocket.prototype.getWallet = function() {
    // Generate on the fly
    var outputs = this.getMyWallet().wallet.outputs;
    var addresses = this.getAllAddresses();
    var pocketOutputs = {};
    Object.keys(outputs).forEach(function(outputKey) {
        var output = outputs[outputKey];
        if (addresses.indexOf(output.address) != -1) {
            pocketOutputs[outputKey] = output;
        }
    });
    return { outputs: pocketOutputs, addresses: addresses };
};

return BasePocket;
});
