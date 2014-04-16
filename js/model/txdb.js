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
    // Clean up incorrect transactions
    var keys = Object.keys(this.transactions);
    for(var idx=0; idx<keys.length; idx++) {
        if (this.transactions[keys[idx]].length <= 20) {
            delete this.transactions[keys[idx]];
        }
    };
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
            if(!err) {
                self.storeTransaction(txHash, tx);
                callback(tx, userData);
            }
        };
        client.fetch_transaction(txHash, gotTransaction);
    } else {
        callback(this.transactions[txHash], userData);
    }
};

/*
 * Store a transaction in the database.
 */
TransactionDatabase.prototype.storeTransaction = function(txHash, tx) {
    if (!this.transactions.hasOwnProperty(txHash)) {
        this.transactions[txHash] = tx;
        this.store.save();
    }
};

return TransactionDatabase;
});
