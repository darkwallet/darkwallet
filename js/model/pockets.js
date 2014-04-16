/*
 * @fileOverview Pocket functionality
 */

define(['bitcoinjs-lib'], function(Bitcoin) {

/**
 * Pockets class.
 * @param {Object} store Store for the object.
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
 * @private
 */
Pockets.prototype.initPockets = function(store) {
    var pockets = store.init('pockets', [{name:'default'}, {name: 'savings'}]);

    // Upgrade pocket store to new format
    if (typeof pockets[0] == 'string') {
        for(var i=0; i< pockets.length; i++) {
            pockets[i] = {'name': pockets[i]};
        };
    }
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
        throw Error("Pocket with that name already exists!");
    }
    this.hdPockets.push({name: name});
    this.store.save();

    // Multisig addresses also have pocket wallets
    this.initPocketWallet(this.hdPockets.length-1);
};

/**
 * Initialize a pockets wallet
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 * @ private
 */
Pockets.prototype.initPocketWallet = function(id) {
    this.pocketWallets[id] = {addresses: [], balance: 0};
};

/**
 * Get a pocket by name
 * @param {String} name Name for the pocket
 */
Pockets.prototype.getPocket = function(name) {
    for(var i=0; i<this.hdPockets.length; i++) {
        if (this.hdPockets[i].name == name) {
            return this.hdPockets[i];
        }
    }
};

/**
 * Delete a pocket
 * @param {String} name Name for the pocket to delete
 */
Pockets.prototype.deletePocket = function(name) {
    for(var i=0; i<this.hdPockets.length; i++) {
        if (this.hdPockets[i].name == name) {
             this.hdPockets[i] = null;
             this.store.save();
             // TODO: Cleanup pocket addresses?
             return;
        }
    }
    throw Error("Pocket with that name does not exist!");
};

/**
 * Get the pocket index for a wallet address
 * @param {Object} walletAddress Address we're looking for
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
 * @param {Object} walletAddress Address we're adding
 */
Pockets.prototype.addToPocket = function(walletAddress) {
    var pocketId = this.getAddressPocketId(walletAddress);

    // add to the list of pocket addresses
    if (!this.pocketWallets.hasOwnProperty(pocketId)) {
        this.initPocketWallet(pocketId);
    }
    this.pocketWallets[pocketId].addresses.push(walletAddress.address);
};

/**
 * Gets the pocket wallet for a pocket
 * @param {Object} id Pocket id (can be branch number, multisig address...)
 */
Pockets.prototype.getPocketWallet = function(id) {
    if (!this.pocketWallets.hasOwnProperty(id)) {
        throw Error("Pocket doesn't exist");
    }
    // Generate on the fly
    var outputs = this.wallet.wallet.outputs;
    var addresses = this.pocketWallets[id].addresses;
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
