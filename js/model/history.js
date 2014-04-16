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
    // Look for repeated element
    for(var idx=this.history.length-1; idx>=0; idx--) {
        if (this.history[idx].hash == newRow.hash) {
            // replace by new row
            if (this.history[idx].height == 0) {
                this.history[idx] = newRow;
                return -1; // confirmed
            }
            return -2; // already confirmed
        }
    }
    // If height is 0 put at the end
    if (newRow.height == 0) {
        return this.history.length;
    }
    // Find index for insertion
    for(var idx=this.history.length-1; idx>=0; idx--) {
        if (this.history[idx].height > 0 && this.history[idx].height < newRow.height) {
            return idx+1;
        }
    }
    return 0;
}

/*
 * Add a row into the history.
 * Will make sure it's inserted sorted by its height.
 * @param {Object} newRow row coming from history.buildHistoryRow
 */
History.prototype.addHistoryRow = function(newRow) {
    var insertInto = this.findIndexForRow(newRow);
    if (insertInto > -1) {
        // Add if it wasn't replaced
        this.history.splice(insertInto, 0, newRow);
    }
    return insertInto;
}

/*
 * Build a history row from a transaction.
 * Will find out which inputs and outputs correspond to the identity wallet and calculate impact.
 * @param {String} transaction Transaction in serialized form
 * @param {Number} height Height for the transaction
 */
History.prototype.buildHistoryRow = function(walletAddress, transaction, height) {
    var identity = this.identity;
        btcWallet = identity.wallet.wallet,
        inMine = 0,
        outMine = 0,
        myInValue = 0,
        myOutValue = 0,
        txAddr = "",
        txObj = new Bitcoin.Transaction(transaction);
    var txHash = Bitcoin.convert.bytesToHex(txObj.getHash());

    // Check inputs
    for(var idx=0; idx<txObj.ins.length; idx++) {
        var anIn = txObj.ins[idx];
        var outIdx = anIn.outpoint.hash+":"+anIn.outpoint.index;
        if (btcWallet.outputs[outIdx]) {
            inMine += 1;
            var output = btcWallet.outputs[outIdx];
            myInValue += output.value;
        }
    }
    if (!inMine) {
        txAddr = 'unknown';
    }
    // Check outputs
    for(var idx=0; idx<txObj.outs.length; idx++) {
        var anOut = txObj.outs[idx];
        if (btcWallet.addresses.indexOf(anOut.address.toString())>-1) {
            outMine += 1;
            myOutValue += anOut.value;
        } else {
            if (inMine) {
                txAddr = anOut.address.toString();
            }
        }
    }
    if (!txAddr) {
        txAddr = 'internal';
    }
    // Create a row representing this change (if already referenced will
    // be replaced)
    var txHash = Bitcoin.convert.bytesToHex(txObj.getHash());
    var newRow = {hash: txHash, tx: txObj, inMine: inMine, outMine: outMine, myInValue: myInValue, myOutValue: myOutValue, height: height, address: txAddr};
    return newRow;
}


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
}

/*
 * Callback for fetching a transaction
 * @private
 */
History.prototype.txFetched = function(walletAddress, transaction, height) {
    var self = this,
        newRow = this.buildHistoryRow(walletAddress, transaction, height);
    // unknown for now means we need to fill in some extra inputs for now get 1st one
    if (newRow.address == 'unknown') {
        if (newRow.tx.ins[0])
        this.identity.txdb.fetchTransaction(newRow.tx.ins[0].outpoint.hash,
                                            function(_a, _b) {self.fillInput(_a, _b)},
                                            [newRow.tx.ins[0].outpoint.index, newRow]);
        else
        console.log("No input!", newRow.tx);
     }
    newRow.addressIndex = walletAddress.index.slice(0);
    newRow.pocket = walletAddress.index[0];
    if (this.addHistoryRow(newRow) > -2) {
        this.update();
        return newRow;
    }
}

/*
 * Look for transactions from given history records
 * @param {Object} history History array as returned by obelisk
 */
History.prototype.fillHistory = function(walletAddress, history) {
    var self = this,
        txdb = this.identity.txdb;
    history.forEach(function(tx) {
        var outTxHash = tx[0],
            inTxHash = tx[4];
        if (inTxHash) {
            txdb.fetchTransaction(inTxHash, function(_a, _b) {self.txFetched(walletAddress, _a, _b)}, tx[6]);
        }
        txdb.fetchTransaction(outTxHash, function(_a, _b) {self.txFetched(walletAddress, _a, _b)}, tx[2]);
    });
}

/*
 * Update callback, needs to be filled in by the application to register.
 */
History.prototype.update = function() {
    console.log("Program needs to register an update callback!");
}

return History;
});
