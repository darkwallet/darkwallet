/*
 * @fileOverview User oriented history view
 */

define(['bitcoinjs-lib'], function(Bitcoin) {
/**
 * History class.
 * @param {Object} store Store for the object.
 * @param {Object} identity Parent identity for the object
 * @constructor
 */
function History(store, identity) {
    this.history = [];
    this.identity = identity;
}

/*
 * Find index for the given row
 * @param {Object} newRow row coming from history.buildHistoryRow
 * Will return -1 if row is already in history.
 * @private
 */
History.prototype.findIndexForRow = function(newRow) {
    var insertInto = 0;
    for(var idx=this.history.length-1; idx>=0; idx--) {
        if (this.history[idx].hash === newRow.hash) {
            return -1;
        }
        if (this.history[idx].height < newRow.height) {
            return idx+1;
        }
    }
    return 0;
};

/*
 * Add a row into the history.
 * Will make sure it's inserted sorted by its height.
 * @param {Object} newRow row coming from history.buildHistoryRow
 */
History.prototype.addHistoryRow = function(newRow) {
    var insertInto = this.findIndexForRow(newRow);
    if (insertInto === -1) {
        return;
    }
    this.history.splice(insertInto, 0, newRow);
    var balance = 0;
    for(var idx=0; idx<this.history.length; idx++) {
        var row = this.history[idx];
        balance += (row.myOutValue - row.myInValue);
        row.balance = balance;
    }
};

/*
 * Build a history row from a transaction.
 * Will find out which inputs and outputs correspond to the identity wallet and calculate impact.
 * @param {String} transaction Transaction in serialized form
 * @param {Number} height Height for the transaction
 */
History.prototype.buildHistoryRow = function(transaction, height) {
    var identity = this.identity;
        btcWallet = identity.wallet.wallet,
        inMine = 0,
        outMine = 0,
        myInValue = 0,
        myOutValue = 0,
        txAddr = "",
        txObj = new Bitcoin.Transaction(transaction);

    // Check inputs
    txObj.ins.forEach(function(anIn) {
        if (btcWallet.outputs[anIn.outpoint.hash+":"+anIn.outpoint.index]) {
            inMine += 1;
            myInValue += btcWallet.outputs[anIn.outpoint.hash+":"+anIn.outpoint.index].value;
        }
    });
    if (!inMine) {
        txAddr = 'unknown';
    }
    // Check outputs
    txObj.outs.forEach(function(anOut) {
        if (btcWallet.addresses.indexOf(anOut.address.toString())>-1) {
            outMine += 1;
            myOutValue += anOut.value;
        } else {
            if (inMine) {
                txAddr = anOut.address.toString();
            }
        }
    });
    if (!txAddr) {
        txAddr = 'internal';
    }
    var txHash = Bitcoin.convert.bytesToHex(txObj.getHash());
    var newRow = {hash: txHash, tx: txObj, inMine: inMine, outMine: outMine, myInValue: myInValue, myOutValue: myOutValue, height: height, address: txAddr};
    return newRow;
};


/*
 * Callback to fill missing input (depending on another transaction)
 * @private
 */
History.prototype.fillInput = function(transaction, data) {
    var index = data[0],
        newRow = data[1],
        txObj = new Bitcoin.Transaction(transaction);
    newRow.address = txObj.outs[index].address.toString();
    this.update();
};

/*
 * Callback for fetching a transaction
 * @private
 */
History.prototype.txFetched = function(transaction, height) {
    var self = this,
        newRow = this.buildHistoryRow(transaction, height);
    // unknown for now means we need to fill in some extra inputs for now get 1st one
    if (newRow.address === 'unknown') {
        this.identity.txdb.fetchTransaction(newRow.tx.ins[0].outpoint.hash,
                                            function(_a, _b) {self.fillInput(_a, _b);},
                                            [newRow.tx.ins[0].outpoint.index, newRow]);
     }
    this.addHistoryRow(newRow);
    this.update();
};

/*
 * Look for transactions from given history records
 * @param {Object} history History array as returned by obelisk
 */
History.prototype.fillHistory = function(history) {
    var self = this,
        txdb = this.identity.txdb;
    history.forEach(function(tx) {
        var outTxHash = tx[0],
            inTxHash = tx[4];
        if (inTxHash) {
            txdb.fetchTransaction(inTxHash, function(_a, _b) {self.txFetched(_a, _b);}, tx[6]);
        }
        txdb.fetchTransaction(outTxHash, function(_a, _b) {self.txFetched(_a, _b);}, tx[2]);
    });
};

/*
 * Update callback, needs to be filled in by the application to register.
 */
History.prototype.update = function() {
    console.log("Program needs to register an update callback!");
};

return History;
});