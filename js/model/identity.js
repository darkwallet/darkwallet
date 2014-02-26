/**
 * @fileOverview Identity properties and data.
 */


/**
 * Identity class.
 * @param {Store} store Object store.
 * @param {String} seed Seed in string form.
 * @param {String} password Password for the identity crypt.
 * @constructor
 */
function Identity(store, seed, password) {
    this.name = store.get('name');
    this.store = store;
    if (seed && password) {
        this.generate(seed, password);
    }
    this.wallet = new Wallet(store);
    this.txdb = new TransactionDatabase(store);
    this.history = new History(store, this);
    this.contacts = new Contacts(store);
}


/**
 * Encrypts identity private information.
 * @param {Object} data Information to be encrypted.
 * @param {String} password Password for the identity crypt.
 * @return {String} The ciphertext serialized data.
 */
Identity.encrypt = function(data, password) {
    var Crypto = Bitcoin.Crypto;
    var passwordDigest = Crypto.SHA256(Crypto.SHA256(Crypto.SHA256(password)));
    return sjcl.encrypt(passwordDigest, JSON.stringify(data), {ks: 256});
}


/**
 * Generate master keys for this identity.
 * TODO: Consider naming private methods with trailing underscore_.
 * @param {String} seed Seed in string form.
 * @param {String} password Password for the identity crypt.
 * @private
 */
Identity.prototype.generate = function(seed, password) {
    // Don't use constructor directly since it doesn't manage hex seed properly.
    var rawSeed = Bitcoin.convert.hexToBytes(seed);
    var key = Bitcoin.BIP32key.prototype.fromMasterKey(rawSeed);
    var identityKey = key.ckd(0x80000000);

    var pubKey = identityKey.getPub().serialize();
    var privKey = identityKey.serialize();

    // TODO we probably don't want to save the seed later here, but let's do it
    // for now to make development easier.
    var privData = Identity.encrypt({privKey: privKey, seed: seed}, password);

    this.store.set('mpk', pubKey);
    this.store.set('version', 1);
    this.store.set('pubkeys', {});
    this.store.set('private', privData);
    this.store.set('contacts', {});
    this.store.set('transactions', {});
    this.store.save();
}
