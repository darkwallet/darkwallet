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
    this.name = store.name;
    this.store = store;
    if (seed && password) {
        this.generate(seed, password);
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

    this.store.set('mpk', pubKey);
    this.store.set('version', 1);
    this.store.set('pubkeys', {});
    this.store.set('private', privData);
    this.store.set('contacts', {});
    this.store.set('transactions', {});
    this.store.save()
}
