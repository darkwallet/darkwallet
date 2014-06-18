'use strict';

define(['bitcoinjs-lib', 'model/pocket/hd', 'model/pocket/multisig'], function(Bitcoin, HdPocket, MultisigPocket) {

/**
 * Pocket functionality.
 * @param {Object} store Store for the object.
 * @param {Object} identity Identity for the object.
 * @param {Object} wallet Wallet for the object.
 * @constructor
 */
function Pockets(store, identity, wallet) {
    this.store = store;
    this.wallet = wallet;
    this.registerTypes();
    this.initPockets(store);
}

/**
 * Register all pocket types
 * @private
 */

Pockets.prototype.registerTypes = function() {
    this.pocketTypes = {};
    this.addressTypes = {};
    this.registerType(HdPocket);
    this.registerType(MultisigPocket);
}

/**
 * Register a pocket type
 * @private
 */
Pockets.prototype.registerType = function(pocketType) {
    var self = this;
    var name = pocketType.type;
    this.pocketTypes[name] = pocketType.prototype;
    pocketType.prototype.types.forEach(function(type) {
        self.addressTypes[type] = pocketType.prototype;
    });
}

/**
 * Initialize store and internal caches for pockets
 * @param {String} store Identity store
 * @return {Object[]} List of pockets
 * @private
 */
Pockets.prototype.initPockets = function(store) {
    this.hdPockets = store.init('pockets', [{name:'spending'}, {name: 'savings'}]);

    // Init pocket wallets (temporary cache for pockets)
    this.pockets = { 'hd': {}, 'multisig': {}, 'readonly': {} };
    for(var i=0; i< this.hdPockets.length; i++) {
        if (this.hdPockets[i]) {
            this.initPocketWallet(i, this.hdPockets[i]);
        }
    }
    return this.hdPockets;
};

/**
 * Create pocket with the given name
 * @param {String} name Name for the new pocket
 */
Pockets.prototype.createPocket = function(name) {
    // Raise exception if name exists
    if (this.getPocket(name)) {
        throw new Error("Pocket with that name already exists!");
    }
    var pocketStore = {name: name};
    this.hdPockets.push(pocketStore);
    this.initPocketWallet(this.hdPockets.length-1, pocketStore);
    this.store.save();
};

/**
 * Initialize a pockets wallet
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 * @private
 */
Pockets.prototype.initPocketWallet = function(id, pocketStore) {
    if (typeof id === 'string') {
        var fund = this.wallet.multisig.search({ address: id });
        if (!fund) {
            // TODO: Create a fake fund for now
            fund = {address: id, name: id};
            console.log("No fund for this address!", id);
        }
        this.pockets.multisig[id] = new MultisigPocket(fund, this);
    } else {
        this.pockets.hd[id] = new HdPocket(pocketStore, this);
    }
};

/**
 * Get an hd pocket by name
 * @param {String} name Name for the pocket
 * @return {Object} The pocket with the given name
 */
Pockets.prototype.getPocket = function(name) {
    for(var i=0; i<this.hdPockets.length; i++) {
        if (this.hdPockets[i] && (this.hdPockets[i].name == name)) {
            return this.hdPockets[i];
        }
    }
};

/**
 * Delete a pocket
 * @param {String} name Name for the pocket to delete
 * @throws {Error} When the pocket doesn't exist
 */
Pockets.prototype.deletePocket = function(name) {
    for(var i=0; i<this.hdPockets.length; i++) {
        if (this.hdPockets[i] && (this.hdPockets[i].name == name)) {
             var pocket = this.hdPockets[i];
             delete this.pockets.hd[i];
             this.hdPockets[i] = null;
             this.store.save();
             return;
        }
    }
    throw new Error("Pocket with that name does not exist!");
};

/**
 * Get the pocket index for a wallet address
 * @param {Object} walletAddress Address we're looking for. See {@link Wallet#getWalletAddress}.
 * @return {Number|String} The pocket index
 */
Pockets.prototype.getAddressPocketId = function(walletAddress) {
    return this.addressTypes[walletAddress.type].getIndex(walletAddress);
};

/**
 * Get all pockets of a certain type
 */

Pockets.prototype.getPockets = function(type) {
    var pockets = this.pockets[this.addressTypes[type].type];
    if (!pockets) {
        throw new Error("Unknown address type! " + type);
    }
    return pockets;
}

/**
 * Add an address to its pocket
 * @param {Object} walletAddress Address we're adding. See {@link Wallet#getWalletAddress}.
 */
Pockets.prototype.addToPocket = function(walletAddress) {
    var pocketBase = this.getPockets(walletAddress.type);
    var pocketId = this.getAddressPocketId(walletAddress);
    // Only autoinitialize multisig funds for now
    var addressType = this.addressTypes[walletAddress.type];
    if (addressType && addressType.autoCreate && !(this.pockets[addressType.type][pocketId])) {
        this.initPocketWallet(pocketId);
    }
    pocketBase[pocketId].addToPocket(walletAddress);
};

/**
 * Gets all public addresses for this pocket.
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 * @return {Array} An array of strings with the addresses.
 */
Pockets.prototype.getAddresses = function(id) {
    return this.pockets.hd[id].getAddresses();
};

/**
 * Gets all change addresses for a pocket.
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 * @return {Array} An array of strings with the addresses.
 */
Pockets.prototype.getChangeAddresses = function(id) {
    return this.pockets.hd[id].getChangeAddresses();
};

/**
 * Gets all addresses for a pocket.
 * @param {Object} id Pocket id (can be pocket index, multisig address...)
 * @return {Array} An array of strings with the addresses.
 */
Pockets.prototype.getAllAddresses = function(id) {
    return this.pockets.hd[id].getAllAddresses();
};

/**
 * Gets the pocket wallet for a pocket
 * @param {Object} id Pocket id (can be pocket index, multisig address...)
 * @return {Object} The pocket wallet
 */
Pockets.prototype.getPocketWallet = function(id) {
    if (typeof id === 'string') {
        return this.pockets.multisig[id].getWallet();
    } else {
        return this.pockets.hd[id].getWallet();
    }
};

return Pockets;
});
