'use strict';

define(['darkwallet'], function(DarkWallet) {
/**
 * Transaction Store.
 * @param {Object} store Store for the object.
 * @constructor
 */
function TransactionDatabase(store) {
    this.transactions = store.init('transactions', {});
    this.store = store;
    // Clean up incorrect transactions
    var keys = Object.keys(this.transactions);
    for(var idx=0; idx<keys.length; idx++) {
        var item = this.transactions[keys[idx]];
        if (Array.isArray(item[0]) && (item[0].length <= 20)) {
            // Clear the transaction information
            item[0] = undefined;
        }
    };
}

/**
 * Get a transaction, will retrieve it from network if needed.
 * @param {String} txHash Transaction hash
 * @param {Function} callback Function that will be called with the transaction, callback will be called with (txData, userData) arguments
 * @param {Object} data Data to add to the callback
 */
TransactionDatabase.prototype.fetchTransaction = function(txHash, callback, userData) {
    var self = this;
    if (!this.transactions[txHash] || !this.transactions[txHash][0]) {
        var client = DarkWallet.getClient();
        var gotTransaction = function(err, tx) {
            if(!err) {
                self.storeTransaction(txHash, tx);
                callback(tx, userData);
            }
        };
        client.fetch_transaction(txHash, gotTransaction);
    } else {
        callback(this.transactions[txHash][0], userData);
    }
};

/**
 * Store a transaction in the database.
 * @param {String} txHash Transaction hash
 * @param {Object} tx     Transaction data
 */
TransactionDatabase.prototype.storeTransaction = function(txHash, tx) {
    if (!this.transactions.hasOwnProperty(txHash)) {
        // Create a new key
        this.transactions[txHash] = [tx];
        this.store.save();
    } else if (!this.transactions[txHash][0]) {
        // Update a key with the tx information
        this.transactions[txHash][0] = tx;
        this.store.save();
    }
};

/**
 * Set the label for a transaction
 * @param {String} txHash Transaction hash
 * @param {String} name Label text
 */
TransactionDatabase.prototype.setLabel = function(txHash, name) {
    if (!this.transactions.hasOwnProperty(txHash)) {
        this.transactions[txHash] = [];
    }
    this.transactions[txHash][1] = name;
    this.store.save();
};

/**
 * Get the label for a transaction
 * @param {String} txHash Transaction hash
 */
TransactionDatabase.prototype.getLabel = function(txHash) {
    if (this.transactions.hasOwnProperty(txHash)) {
        return this.transactions[txHash][1];
    }
};

/**
 * Get the body for a transaction
 * @param {String} txHash Transaction hash
 */
TransactionDatabase.prototype.getBody = function(txHash) {
    if (this.transactions.hasOwnProperty(txHash)) {
        return this.transactions[txHash][0];
    }
};

return TransactionDatabase;
});
