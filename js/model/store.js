/*
 * Store
 *
 * Store for one identity, gets serialized through the keyring.
 */
function Store(data, keyring) {
    this.store = data;
    this.keyring = keyring;
}

Store.prototype.get = function(key) {
    return this.store.get(key);
}
Store.prototype.set = function(key, value) {
    this.store[key] = value;
}
Store.prototype.iter = function() {
    return this.store;
}
Store.prototype.length = function() {
    return this.store.length;
}
Store.prototype.save = function(key) {
    this.keyring.save(this.store.id, this.store)
}

