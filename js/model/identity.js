'use strict';

define(['./wallet', './txdb', './history', './tasks', './contacts', './connections', 'bitcoinjs-lib'],
function(Wallet, TransactionDatabase, History, Tasks, Contacts, Connections, Bitcoin) {
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
      fiatCurrency: 'EUR',
      animations: {
        enabled: true
      },
      notifications: {
        popup: true,
        send: true,
        receive: true,
        multisig: true
      }
    });
    // Temporary upgrade store to adapt wallets, we will
    // remove this for release and add a proper mechanism.
    if (!this.settings.hasOwnProperty('notifications')) {
        this.settings.notifications = { popup: true };
    }
    if (!this.settings.hasOwnProperty('animations')) {
        this.settings.animations = { enabled: true };
    }
    this.store = store;
    if (seed && password) {
        this.generate(seed, password, store.get('network'));
    }
    this.wallet = new Wallet(store, this);
    this.txdb = new TransactionDatabase(store);
    this.history = new History(store, this);
    this.contacts = new Contacts(store, this);
    this.connections = new Connections(store, this);
    this.tasks = new Tasks(store, this);
    this.reseed = store.get('reseed');
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
    var network = (network == 'bitcoin') ? 'mainnet' : network;
    // Don't use constructor directly since it doesn't manage hex seed properly.
    var key = Bitcoin.HDWallet.fromSeedHex(seed, network);
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
    this.store.set('pubkeys', {});
    this.store.save();
};

return Identity;
});
