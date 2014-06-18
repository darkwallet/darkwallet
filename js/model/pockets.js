'use strict';

define(['bitcoinjs-lib'], function(Bitcoin) {

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
    this.hdPockets = this.initPockets(store)
}

/**
 * Initialize store and internal caches for pockets
 * @param {String} store Identity store
 * @return {Object[]} List of pockets
 * @private
 */
Pockets.prototype.initPockets = function(store) {
    var pockets = store.init('pockets', [{name:'spending'}, {name: 'savings'}]);

    // Init pocket wallets (temporary cache for pockets)
    this.pocketWallets = {};
    for(var i=0; i< pockets.length; i++) {
        this.initPocketWallet(i);
    };
    return pockets;
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
    this.hdPockets.push({name: name});
    this.store.save();

    // Multisig addresses also have pocket wallets
    this.initPocketWallet(this.hdPockets.length-1);
};

/**
 * Initialize a pockets wallet
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 * @private
 */
Pockets.prototype.initPocketWallet = function(id) {
    this.pocketWallets[id] = {addresses: [], changeAddresses: [], balance: 0};
};

/**
 * Get a pocket by name
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
             this.hdPockets[i] = null;
             this.store.save();
             // TODO: Cleanup pocket addresses?
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
    if (walletAddress.type == 'multisig') {
        return walletAddress.index[0];
    } else {
        return Math.floor(walletAddress.index[0]/2);
    }
};

/**
 * Add an address to its pocket
 * @param {Object} walletAddress Address we're adding. See {@link Wallet#getWalletAddress}.
 */
Pockets.prototype.addToPocket = function(walletAddress) {
    var pocketId = this.getAddressPocketId(walletAddress);

    // add to the list of pocket addresses
    if (!this.pocketWallets.hasOwnProperty(pocketId)) {
        this.initPocketWallet(pocketId);
    }
    if (walletAddress.index[0]%2 === 1) {
        this.pocketWallets[pocketId].changeAddresses.push(walletAddress.address);
    } else {
        this.pocketWallets[pocketId].addresses.push(walletAddress.address);
    }
};

/**
 * Gets all public addresses for this pocket.
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 * @return {Array} An array of strings with the addresses.
 */
Pockets.prototype.getAddresses = function(id) {
    return this.pocketWallets[id].addresses;
};

/**
 * Gets all change addresses for this pocket.
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 * @return {Array} An array of strings with the addresses.
 */
Pockets.prototype.getChangeAddresses = function(id) {
    return this.pocketWallets[id].changeAddresses;
};

/**
 * Gets all addresses for this pocket.
 * @param {Object} id Pocket id (can be pocket index, multisig address...)
 * @return {Array} An array of strings with the addresses.
 */
Pockets.prototype.getAllAddresses = function(id) {
    return this.getAddresses(id).concat(this.getChangeAddresses(id));
};


/**
 * Gets the pocket wallet for a pocket
 * @param {Object} id Pocket id (can be pocket index, multisig address...)
 * @return {Object} The pocket wallet
 */
Pockets.prototype.getPocketWallet = function(id) {
    if (!this.pocketWallets.hasOwnProperty(id)) {
        throw new Error("Pocket doesn't exist");
    }
    // Generate on the fly
    var outputs = this.wallet.wallet.outputs;
    var addresses = this.getAllAddresses(id);
    var pocketOutputs = {};
    Object.keys(outputs).forEach(function(outputKey) {
        var output = outputs[outputKey];
        if (addresses.indexOf(output.address) != -1) {
            pocketOutputs[outputKey] = output;
        }
    });
    var tmpWallet = new Bitcoin.Wallet(this.mpk);
    tmpWallet.outputs = pocketOutputs;
    tmpWallet.addresses = addresses;
    return tmpWallet;
};

return Pockets;
});
