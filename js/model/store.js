/**
 * @fileOverview Mapping coordinating with the app's database.
 */

/**
 * Store class.
 * @constructor
 */
function Store(data, keyring) {
    this.store = data;
    this.keyring = keyring;
}

/**
 * Get a value from the store.
 * @param {String} key Key for the value to retrieve.
 */
Store.prototype.get = function(key) {
    return this.store[key];
}
/**
 * Set a key value pair into the the store.
 * @param {String} key Key for the value to retrieve.
 * @param {Object} value Value to store, should be any simple type (including arrays).
 */
Store.prototype.set = function(key, value) {
    this.store[key] = value;
}

/**
 * Save the store to database.
 * This function must be called or changes to the store won't be saved.
 */
Store.prototype.save = function() {
    this.keyring.save(this.store.name, this.store);
}

