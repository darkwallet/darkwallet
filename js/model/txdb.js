/*
 * @fileOverview Transaction Store
 */

define(['darkwallet'], function(DarkWallet) {
/**
 * TransactionDatabase class.
 * @param {Object} store Store for the object.
 * @constructor
 */
function TransactionDatabase(store) {
    this.transactions = store.init('transactions', {});
    this.store = store;

}

/*
 * Get a transaction, will retrieve it from network if needed.
 * @param {String} txHash Transaction hash
 * @param {Function} callback Function that will be called with the transaction, callback will be called with (txData, userData) arguments
 * @param {Object} data Data to add to the callback
 */
TransactionDatabase.prototype.fetchTransaction = function(txHash, callback, userData) {
    var self = this;
    if (!this.transactions[txHash]) {
        var client = DarkWallet.getClient();
        var gotTransaction = function(err, tx) {
            self.transactions[txHash] = tx;
            self.store.save();
            if(!err) {
                callback(tx, userData);
            }
        }
        client.fetch_transaction(txHash, gotTransaction);
    } else {
        callback(this.transactions[txHash], userData);
    }
}

return TransactionDatabase;
});