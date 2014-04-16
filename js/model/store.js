define(['bitcoinjs-lib', 'sjcl'], function(Bitcoin) {
/**
 * Mapping coordinating with the app's database.
 * @constructor
 * @param {Object} data Initial data
 * @param {Object} keyring Keyring
 */
function Store(data, keyring) {
    this.store = data;
    this.keyring = keyring;
}

/**
 * Get a value from the store.
 * @param {String} key Key for the value to retrieve.
 * @return {Mixed} Stored value
 */
Store.prototype.get = function(key) {
    return this.store[key];
};

/**
 * Set a key value pair into the the store.
 * @param {String} key Key for the value to retrieve.
 * @param {Mixed} value Value to store, should be any simple type (including arrays).
 */
Store.prototype.set = function(key, value) {
    this.store[key] = value;
};

/**
 * Set value to default if not defined.
 * @param {String} key Key for the value to retrieve.
 * @param {Mixed} value Value to store, should be any simple type (including arrays).
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
 * @param {Function} callback Function to call on save.
 */
Store.prototype.save = function(callback) {
    this.keyring.save(this.store.name, this.store, callback);
};

/**
 * Get the decrypted private user data.
 * @param {String} password Password to decrypt the private data
 * @return {Mixed} Decrypted information
 */
Store.prototype.getPrivateData = function(password) {
    var SHA256 = Bitcoin.CryptoJS.SHA256;
    var passwordDigest = Bitcoin.convert.wordArrayToBytes(SHA256(SHA256(SHA256(password))));
    passwordDigest = Bitcoin.convert.bytesToString(passwordDigest);
    var data = JSON.parse(sjcl.decrypt(passwordDigest, this.get('private')));
    if (!data.privKeys) {
        data.privKeys = {};
    }
    return data;
};

/**
 * Encrypts identity private information and saves it.
 * @param {Mixed} data Information to be encrypted.
 * @param {String} password Password for the identity crypt.
 * 
 */
Store.prototype.setPrivateData = function(data, password) {
    var Crypto = Bitcoin.CryptoJS;
    var passwordDigest = Bitcoin.convert.wordArrayToBytes(Crypto.SHA256(Crypto.SHA256(Crypto.SHA256(password))));
    passwordDigest = Bitcoin.convert.bytesToString(passwordDigest);
    var privData = sjcl.encrypt(passwordDigest, JSON.stringify(data), {ks: 256, ts: 128});
    this.set('private', privData);
};

return Store;
});
