/*
 * Identity
 *
 * Main object holding identity properties and data.
 */

/**
 * Identity class.
 * @param {dict} store Object store
 * @constructor
 */
function Identity(store, seed, password) {
    this.id = store.id;
    this.store = store;
    if (seed && password) {
        self.generate(seed, password)
    }
    this.wallet = new Wallet(store);
    this.contacts = new Contacts(store);
}

Identity.prototype.encrypt = function(data, password) {
    return sjcl.encrypt(password, JSON.stringify(data));
}

Identity.prototype.generate = function(seed, password) {
    var key = new Bitcoin.BIP32key(seed);
    var pubKey = key.getPub().serialize();
    var privKey = key.serialize();

    var privData = this.encrypt({privKey: privKey}, password);

    data = {'mpk': pubKey,
	    'id': name,
	    'version': 1,
	    'pubkeys': {},
	    'private': privData,
	    'contacts': {},
	    'transactions': {}};
    // recreate the store with new data
    this.store = new Store(data, this.store.keyring)
    this.store.save()
}
