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
        var gotTransaction = function(err, tx) {
            if(!err) {
                self.storeTransaction(txHash, tx);
                callback(tx, userData);
            }
        };
        DarkWallet.client.fetch_transaction(txHash, gotTransaction);
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
 * Generic par getter and setter
 */
TransactionDatabase.prototype.setGeneric = function(txHash, parIdx, val, save) {
    if (!this.transactions.hasOwnProperty(txHash)) {
        this.transactions[txHash] = [];
    }
    this.transactions[txHash][parIdx] = val;
    if (save) {
        this.store.save();
    }
};

TransactionDatabase.prototype.getGeneric = function(txHash, parIdx) {
    if (this.transactions.hasOwnProperty(txHash)) {
        return this.transactions[txHash][parIdx];
    }
};

TransactionDatabase.prototype.setHeight = function(txHash, name, save) {
    this.setGeneric(txHash, 2, name, save);
};

TransactionDatabase.prototype.getHeight = function(txHash) {
    return this.getGeneric(txHash, 2);
};

TransactionDatabase.prototype.setImpact = function(txHash, impact, save) {
    this.setGeneric(txHash, 3, impact, save);
};

TransactionDatabase.prototype.getImpact = function(txHash) {
    return this.getGeneric(txHash, 3);
};

TransactionDatabase.prototype.setOutAddresses = function(txHash, outAddresses, save) {
    this.setGeneric(txHash, 4, outAddresses, save);
};

TransactionDatabase.prototype.getOutAddresses = function(txHash) {
    return this.getGeneric(txHash, 4);
};

TransactionDatabase.prototype.setAddress = function(txHash, address, save) {
    this.setGeneric(txHash, 5, address, save);
};

TransactionDatabase.prototype.getAddress = function(txHash) {
    return this.getGeneric(txHash, 5);
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
