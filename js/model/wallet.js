/*
 * @fileOverview Access to the identity bitcoin keys
 */

/**
 * Wallet class.
 * @param {Object} store Store for the object.
 * @constructor
 */
function Wallet(store) {
    this.is_cold = store.get('is_cold');
    this.pubKeys = store.init('pubkeys', {});
    this.mpk = store.get('mpk');
    if (!this.mpk) {
         console.log("Wallet without mpk!", this.mpk);
    }
    this.store = store;
}

/**
 * Get an address from this wallet.
 * @param {Integer} n Sequence number for the address.
 * @param {Boolean/Integer} pocket Pocket to use (pocket 0 is default, 1 is change, >2 are used defined).
 */
Wallet.prototype.getAddress = function(n, pocket) {
    if (!pocket) {
        pocket = 0;
    }
    var addrId = [pocket, n];
    if (this.pubKeys[addrId]) {
        return this.pubKeys[addrId];
    }
    else {
        // derive from mpk
        var mpKey = new Bitcoin.BIP32key(this.mpk);

        // BIP32 js support is still missing some part and we can't get addresses
        // from pubkey yet, unless we do it custom like here...:
        // (mpKey.key.getBitcoinAddress doesn't work since 'key' is not a key
        // object but binary representation).
        var childKey = mpKey.ckd(pocket).ckd(n);
        var mpKeyHash;
        if (childKey.key.length) {
            mpKeyHash = Bitcoin.Util.sha256ripe160(childKey.key);
        } else {
            mpKeyHash = Bitcoin.Util.sha256ripe160(childKey.key.getPub());
        }
        var address = new Bitcoin.Address(mpKeyHash);

        this.pubKeys[addrId] = address.toString();
        this.store.save();
        return address;
    }
}

