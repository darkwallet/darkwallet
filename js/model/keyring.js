/*
 * IdentityKeyRing
 *
 * Manages and serializes identities.
 */

var DW_NS = 'dw:identity:';

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

IdentityKeyRing.prototype.getIdentityNames = function() {
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

/*
 * @private
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
 */
IdentityKeyRing.prototype.save = function(name, data, callback) {
    var pars = {};
    pars[DW_NS+name] = data;
    chrome.storage.local.set(pars, callback);
}

