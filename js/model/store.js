/**
 * @fileOverview Mapping coordinating with the app's database.
 */

define(function() {
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
};

/**
 * Set a key value pair into the the store.
 * @param {String} key Key for the value to retrieve.
 * @param {Object} value Value to store, should be any simple type (including arrays).
 */
Store.prototype.set = function(key, value) {
    this.store[key] = value;
};

/**
 * Set value to default if not defined.
 * @param {String} key Key for the value to retrieve.
 * @param {Object} value Value to store, should be any simple type (including arrays).
 */
Store.prototype.init = function(key, value) {
    if (!this.store[key]) {
        this.store[key] = value;
    }
    return this.store[key];
};


/**
 * Save the store to database.
 * This function must be called or changes to the store won't be saved.
 */
Store.prototype.save = function() {
    this.keyring.save(this.store.name, this.store);
};

return Store;
});