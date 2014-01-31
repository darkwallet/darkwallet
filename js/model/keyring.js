/*
 * IdentityKeyRing
 *
 * Manages and serializes identities.
 */
function IdentityKeyRing() {
    this.identities = {};
    this.availableIdentities = [];
    this.loadIdentities();
}

IdentityKeyRing.prototype.get = function(name, callback) {
    if (this.identities[name]) {
        callback(this.identities[name]);
    } else if (this.availableIdentities.indexOf(name) != -1) {
        this.load(name, callback);
    } else {
        throw "Identity doesn't exist";
    }
}

IdentityKeyRing.prototype.getIdentities = function() {
    return this.availableIdentities;
}

IdentityKeyRing.prototype.close = function(name, callback) {
   delete this.identities[name];
}

IdentityKeyRing.prototype.createIdentity = function(name, seed, password) {
   var identity = new Identity(new Store({name: name}, this), seed, password);
   this.identities[name] = identity;
   return identity;
}

/*
 * @private
 */
IdentityKeyRing.prototype.loadIdentities = function(callback) {
    var self = this;
    chrome.storage.local.get(null, function(obj) {
        self.availableIdentity = Object.keys(obj);
    });
}

/*
 * @private
 */
IdentityKeyRing.prototype.load = function(name, callback) {
    chrome.storage.local.get(name, callback);
}

/*
 * @private
 */
IdentityKeyRing.prototype.save = function(name, data, callback) {
    chrome.storage.local.set({name: data}, callback);
}


