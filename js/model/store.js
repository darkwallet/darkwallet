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
    return this.store[key];
}
Store.prototype.set = function(key, value) {
    this.store[key] = value;
}
Store.prototype.save = function() {
    this.keyring.save(this.store.name, this.store);
}

