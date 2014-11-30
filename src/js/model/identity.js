'use strict';

define(['./wallet', './txdb', './history', './tasks', './contacts', './connections', 'bitcoinjs-lib', 'util/fiat', './tx'],
function(Wallet, TransactionDatabase, History, Tasks, Contacts, Connections, Bitcoin, FiatCurrency, Transaction) {
/**
 * Identity properties and data.
 * @param {Store} store Object store.
 * @param {String} [seed] Seed in string form.
 * @param {String} [password] Password for the identity crypt.
 * @constructor
 */
function Identity(store, seed, password) {
    this.name = store.get('name');
    this.settings = store.init('settings', {
      currency: 'BTC',
      fiatCurrency: FiatCurrency.getDefault(),
      animations: {
        enabled: true
      },
      notifications: {
        popup: false,
        send: true,
        receive: true,
        multisig: true
      },
      language: 'en_US'
    });
    // Temporary upgrade store to adapt wallets, we will
    // remove this for release and add a proper mechanism.
    if (!this.settings.hasOwnProperty('notifications')) {
        this.settings.notifications = { popup: false };
    }
    if (!this.settings.hasOwnProperty('animations')) {
        this.settings.animations = { enabled: true };
    }
    if (!this.settings.hasOwnProperty('language')) {
        this.settings.language = 'en_US';
    }
    this.store = store;
    if (seed && password) {
        this.generate(seed, password, store.get('network'));
    }
    var inittime = Date.now();
    this.tx = new Transaction(store, this);
    this.txdb = new TransactionDatabase(store);
    this.wallet = new Wallet(store, this);
    this.history = new History(store, this);
    this.contacts = new Contacts(store, this);
    this.connections = new Connections(store, this);
    this.tasks = new Tasks(store, this);
    this.reseed = store.get('reseed');
    console.log("init identity", (Date.now()-inittime)/1000);
}

/**
 * Change the password for the identity crypt.
 * @param {String} oldPassword Password to decrypt
 * @param {String} newPassword Password to re-encrypt
 * @return {Boolean} Success or old password is not correct
 */
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
};

/**
 * Generate master keys for this identity.
 * TODO: Consider naming private methods with trailing underscore_.
 * @param {String} seed Seed in hex form.
 * @param {String} password Password for the identity crypt.
 * @private
 */
Identity.prototype.generate = function(seed, password, network) {
    // Don't use constructor directly since it doesn't manage hex seed properly.
    var key = Bitcoin.HDNode.fromSeedHex(seed, Bitcoin.networks[network]);
    var netId = (network==='bitcoin') ? 0 : 1;
    // m / purpose' / coin_type'
    var rootKey = key.deriveHardened(44).deriveHardened(netId);

    var pubKey = rootKey.toBase58(false);
    var privKey = rootKey.toBase58(true);

    var hardKey = key.deriveHardened(88).deriveHardened(netId);
    // Initialize the scan public key here for now...
    var scanKey = hardKey.deriveHardened(0);
    var scanPubKey = scanKey.toBase58(false);
    var scanPrivKey = scanKey.toBase58(true);

    // Initialize the id key here for now...
    var idKey = hardKey.deriveHardened(1);
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

    // save some mpks for the pockets
    this.store.set('mpks', [rootKey.deriveHardened(0).toBase58(false), rootKey.deriveHardened(1).toBase58(false), rootKey.deriveHardened(2).toBase58(false)]);

    this.store.set('mpk', pubKey);
    // don't overwrite if reseeding
    if (!this.store.get('pubkeys')) {
        this.store.set('pubkeys', {});
    }
    this.store.save();
};

/**
 * Provides a customized result for JSON.stringify(identity).
 * @returns Public JSON
 */
Identity.prototype.toJSON = function() {
    return {
        name: this.name,
        settings: this.settings,
        //tx: this.tx,
        //txdb: this.txdb,
        wallet: this.wallet,
        //history: this.history,
        //contacts: this.contacts,
        conections: this.connections,
        //tasks: this.tasks,
        reseed: this.reseed
    };
}

return Identity;
});
