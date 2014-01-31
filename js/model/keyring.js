/*
 * IdentityKeyRing
 *
 * Manages and serializes identities.
 */
function IdentityKeyRing() {
    this.identities = {};
    this._keys = [];
    this.loadIdentities();
}

IdentityKeyRing.prototype.get = function(key, callback) {
    if (this.identities[key]) {
        callback(this.identities[key]);
    } else if (this._keys.indexOf(key) != -1) {
        this.load(key, callback)
    } else {
        // XXX seed and password should come from somewhere else here
        var password = 'bar';
        var seed = 23;
        this.createIdentity(key, seed, password, callback);
    }
}

IdentityKeyRing.prototype.keys = function() {
    return this._keys;
}

IdentityKeyRing.prototype.loadIdentities = function(callback) {
    chrome.storage.local.get(null, function(obj) {
        this._keys = Object.keys(obj);
    });
}

IdentityKeyRing.prototype.load = function(id, callback) {
    chrome.storage.local.get(id, callback);
}

IdentityKeyRing.prototype.save = function(id, data, callback) {
    chrome.storage.local.set({id: data}, callback);
}

IdentityKeyRing.prototype.close = function(id, callback) {
   delete this.identities[name];
}

IdentityKeyRing.prototype.createIdentity = function(name, seed, password) {
   var identity = new Identity(new Store({id: name}, this), seed, password);
   this.identities[name] = identity;
   return identity;
}

