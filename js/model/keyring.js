/*
 * @fileOverview Manage and serialize identities.
 */

// DarkWallet namespace for the local storage.
var DW_NS = 'dw:identity:';

/**
 * IdentityKeyRing class.
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
 */
IdentityKeyRing.prototype.get = function(name, callback) {
    if (this.identities[name]) {
        callback(this.identities[name]);
    } else if (this.availableIdentities.indexOf(name) != -1) {
        this.load(name, callback);
    } else {
        throw "Identity doesn't exist";
    }
}

/**
 * Get names for all identities available.
 */
IdentityKeyRing.prototype.getIdentityNames = function() {
    return this.availableIdentities;
}

/**
 * Release resources for an identity.
 * @param {String} name Identity identifier.
 */
IdentityKeyRing.prototype.close = function(name) {
    delete this.identities[name];
}

/**
 * Create an identity.
 * @param {String} name Identity identifier.
 * @param {String} seed Seed for the keys in string format.
 * @param {String} password Password for the identity crypt.
 */
IdentityKeyRing.prototype.createIdentity = function(name, seed, password) {
    var identity = new Identity(new Store({name: name}, this), seed, password);
    this.identities[name] = identity;
    if (this.availableIdentities.indexOf(name) == -1) {
        this.availableIdentities.push(name);
    }
    return identity;
}

/**
 * @private
 * Load a list of all available identities.
 * @param {Function} callback Callback providing results for the function.
 */
IdentityKeyRing.prototype.loadIdentities = function(callback) {
    var self = this;
    var _callback = callback;
    chrome.storage.local.get(null, function(obj) {
        var keys = Object.keys(obj);
        for(var idx=0; idx<keys.length; idx++) {
            if (keys[idx].substring(0, DW_NS.length) == DW_NS) {
                var name = keys[idx].substring(DW_NS.length);
                if (self.availableIdentities.indexOf(name) == -1) {
                    self.availableIdentities.push(name);
                }
            }
        }
        if (_callback) {
            _callback(self.availableIdentities);
        }
    });
}

/**
 * @private
 * Load an identity from database.
 * @param {String} name Identity identifier.
 * @param {Function} callback Callback providing results for the function.
 */
IdentityKeyRing.prototype.load = function(name, callback) {
    var self = this;
    var _name = name;
    var _callback = callback;
    chrome.storage.local.get(DW_NS+name, function(obj) {
        self.identities[_name] = new Identity(new Store(obj[DW_NS+_name], self));
        if (_callback) {
            _callback(self.identities[_name]);
        }
    });
}

/*
 * @private
 * Save an identity into the database.
 * @param {String} name Identity identifier.
 * @param {Object} data Identity data (mapping).
 * @param {Function} callback Callback providing results for the function.
 */
IdentityKeyRing.prototype.save = function(name, data, callback) {
    var pars = {};
    pars[DW_NS+name] = data;
    chrome.storage.local.set(pars, callback);
}

/*
 * Clear database (DANGEROUS!)
 */
IdentityKeyRing.prototype.clear = function() {
      chrome.storage.local.clear();
}
