'use strict';

define(['model/identity', 'model/store', 'model/upgrade'], function(Identity, Store, Upgrade) {
// DarkWallet namespace for the local storage.
var DW_NS = 'dw:identity:';

/**
 * Manage and serialize identities.
 * @constructor
 */
function IdentityKeyRing() {
    this.identities = {};
    this.availableIdentities = [];
    this.loadIdentities();
}

/**
 * Get an identity from cache or store.
 * @param {String} name Identity identifier.
 * @param {Function} callback Callback providing results for the function.
 * @throws {Error} When identity doesn't exist.
 */
IdentityKeyRing.prototype.get = function(name, callback) {
    if (this.identities[name]) {
        callback(this.identities[name]);
    } else if (this.availableIdentities.indexOf(name) != -1) {
        this.load(name, callback);
    } else {
        throw Error("Identity doesn't exist");
    }
};

/**
 * Delete an identity from the keyring
 * @param {String} name Identity identifier.
 * @param {Function} callback Callback providing results for the function.
 */
IdentityKeyRing.prototype.remove = function(name, callback) {
    var self = this;
    var idx = this.availableIdentities.indexOf(name);
    if (idx == -1) {
        throw Error("The identity doesn't exist!");
    }
    // Close the identity
    if (this.identities[name]) {
        this.close(name);
    }
    chrome.storage.local.remove(DW_NS+name, function() {
        self.availableIdentities.splice(idx, 1);
        callback ? callback() : null;
    });

};


/**
 * Get names for all identities available.
 * @return {String[]} List of the available identities.
 */
IdentityKeyRing.prototype.getIdentityNames = function() {
    return this.availableIdentities;
};

/**
 * Release resources for an identity.
 * @param {String} name Identity identifier.
 */
IdentityKeyRing.prototype.close = function(name) {
    delete this.identities[name];
};

/**
 * Rename an identity.
 * @param {String} name Old name
 * @param {String} newName New name
 */
IdentityKeyRing.prototype.rename = function(name, newName, callback) {
    var self = this;
    var store = this.identities[name].store;
    if (!store) {
        throw Error("Identity must be loaded to rename");
    }
    var oldIdx = this.availableIdentities.indexOf(name);
    // First save under the new name
    store.set('name', newName);
    this.identities[newName] = this.identities[name];
    store.save(function() {
        // Now remove the old version from the store
        self.remove(name, function() {
            var idx = self.availableIdentities.indexOf(newName);
            // Remove the new name from the end
            self.availableIdentities.splice(idx, 1)
            // Insert the new name in its old place
            self.availableIdentities.splice(oldIdx, 0, newName);
            // Done
            callback ? callback() : null;
         });
    });
};


/**
 * Create an identity.
 * @param {String} name Identity identifier.
 * @param {String} seed Seed for the keys in string format.
 * @param {String} password Password for the identity crypt.
 * @return {Object} The new identity
 */
IdentityKeyRing.prototype.createIdentity = function(name, network, seed, password) {
    var identity = new Identity(new Store({name: name, network: network, version: 3}, this), seed, password);
    this.identities[name] = identity;
    if (this.availableIdentities.indexOf(name) == -1) {
        this.availableIdentities.push(name);
    }
    return identity;
};

/**
 * Load a list of all available identities.
 * @param {Function} callback Callback providing results for the function.
 * @private
 */
IdentityKeyRing.prototype.loadIdentities = function(callback) {
    var self = this;
    var _callback = callback;

    // See if we have cached list
    if (this.availableIdentities.length) {
       if (_callback) {
            _callback(this.availableIdentities);
       }
       return;
    }
    // Load from local storage
    console.log('[Keyring] Load from local storage');
    chrome.storage.local.get(null, function(obj) {
        console.log('[Keyring] Loaded');
        var keys = Object.keys(obj);
        for(var idx=0; idx<keys.length; idx++) {
            if (keys[idx].substring(0, DW_NS.length) == DW_NS) {
                var name = keys[idx].substring(DW_NS.length);
                self.availableIdentities.push(name);
            }
        }
        if (_callback) {
            _callback(self.availableIdentities);
        }
    });
};

/**
 * Load an identity from database.
 * @param {String} name Identity identifier.
 * @param {Function} callback Callback providing results for the function.
 * @private
 */
IdentityKeyRing.prototype.load = function(name, callback) {
    var self = this;
    chrome.storage.local.get(DW_NS+name, function(obj) {
        var store = obj[DW_NS+name];
        // Finish loading
        var finishLoading = function() {
            self.identities[name] = new Identity(new Store(store, self));
            if (callback) {
                callback(self.identities[name]);
            }
        }
        // Check for upgrade
        if (Upgrade(store)) {
            self.save(name, store, finishLoading)
        } else {
            finishLoading()
        }
    });
};

/*
 * Save an identity into the database.
 * @param {String} name Identity identifier.
 * @param {Object} data Identity data (mapping).
 * @param {Function} callback Callback providing results for the function.
 * @private
 */
IdentityKeyRing.prototype.save = function(name, data, callback) {
    var pars = {};
    pars[DW_NS+name] = data;
    // If this is a new identity add it to the available identities list.
    if (this.availableIdentities.indexOf(name) == -1) {
        this.availableIdentities.push(name);
    }
    chrome.storage.local.set(pars, callback);
};

/**
 * Get raw data for an identity
 * @param {String} name Identity identifier.
 * @param {Function} callback Callback providing results for the function.
 * @private
 */
IdentityKeyRing.prototype.getRaw = function(name, callback) {
    name = name ? DW_NS+name : null;
    chrome.storage.local.get(name, callback);
};


/*
 * Get the storage space the identity uses
 * @param {String} name Identity identifier.
 * @param {Function} callback Callback providing results for the function.
 */

IdentityKeyRing.prototype.getSize = function(name, callback) {
    name = name ? DW_NS+name : null;
    chrome.storage.local.getBytesInUse(name, callback);
};

/*
 * Clear database (DANGEROUS!)
 */
IdentityKeyRing.prototype.clear = function() {
    chrome.storage.local.clear();
    this.identities = {};
    this.availableIdentities = [];
};

return IdentityKeyRing;
});
