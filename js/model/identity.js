/**
 * @fileOverview Identity properties and data.
 */


define(['./wallet', './txdb', './history', './tasks', './contacts', './connections', 'bitcoinjs-lib'],
function(Wallet, TransactionDatabase, History, Tasks, Contacts, Connections, Bitcoin) {
/**
 * Identity class.
 * @param {Store} store Object store.
 * @param {String} seed Seed in string form.
 * @param {String} password Password for the identity crypt.
 * @constructor
 */
function Identity(store, seed, password) {
    this.name = store.get('name');
    this.settings = store.init('settings', {currency: 'BTC', fiatCurrency: 'EUR', notifications: {popup: true}});
    // Temporary upgrade store to adapt wallets, we will
    // remove this for release and add a proper mechanism.
    if (!this.settings.hasOwnProperty('notifications')) {
        this.settings.notifications = { popup: true };
    }
    this.store = store;
    if (seed && password) {
        this.generate(seed, password);
    }
    this.wallet = new Wallet(store, this);
    this.txdb = new TransactionDatabase(store);
    this.history = new History(store, this);
    this.contacts = new Contacts(store);
    this.connections = new Connections(store, this);
    this.tasks = new Tasks(store, this);
}

Identity.prototype.changePassword = function(oldPassword, newPassword) {
    try {
        var data = this.store.getPrivateData(oldPassword);
        this.store.setPrivateData(data, newPassword)
        return true;
    } catch (e) {
        if (e.message !== "ccm: tag doesn't match") {
            throw e;
        }
        return false;
    }
}

/**
 * Generate master keys for this identity.
 * TODO: Consider naming private methods with trailing underscore_.
 * @param {String} seed Seed in hex form.
 * @param {String} password Password for the identity crypt.
 * @private
 */
Identity.prototype.generate = function(seed, password) {
    // Don't use constructor directly since it doesn't manage hex seed properly.
    var key = Bitcoin.HDWallet.fromSeedHex(seed);
    var identityKey = key.derivePrivate(0);

    var pubKey = identityKey.toBase58(false);
    var privKey = identityKey.toBase58(true);

    // Initialize the scan public key here for now...
    var scanKey = identityKey.derivePrivate(0);
    var scanPubKey = scanKey.toBase58(false);
    var scanPrivKey = scanKey.toBase58(true);

    // Initialize the id key here for now...
    var idKey = identityKey.derivePrivate(1);
    var idPubKey = idKey.toBase58(false);
    var idPrivKey = idKey.toBase58(true);

    // TODO we probably don't want to save the seed later here, but let's do it
    // for now to make development easier.
    this.store.setPrivateData({privKey: privKey, seed: seed}, password);

    // The scan and id keys need to be unprotected so they can be accessed
    // without prompting for send password, they are private derivations so
    // they won't compromise the rest of the wallet.
    this.store.set('scankeys', [{pub: scanPubKey, priv: scanPrivKey}]);
    this.store.set('idkeys', [{pub: idPubKey, priv: idPrivKey}]);

    this.store.set('mpk', pubKey);
    this.store.set('version', 1);
    this.store.set('pubkeys', {});
    this.store.set('contacts', {});
    this.store.set('transactions', {});
    this.store.save();
}

return Identity;
});
