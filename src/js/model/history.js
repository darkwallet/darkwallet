'use strict';

define(['bitcoinjs-lib', 'util/btc', 'model/historyrow'], function(Bitcoin, BtcUtils, HistoryRow) {

/**
 * User oriented history view.
 * @param {Object} store Store for the object.
 * @param {Object} identity Parent identity for the object
 * @constructor
 */
function History(store, identity) {
    this.history = [];
    this.identity = identity;
    var self = this;
    Object.keys(identity.txdb.transactions).forEach(function(txId) {
        if (identity.txdb.getImpact(txId)) {
            self.history.push(new HistoryRow(txId, identity));
        }
    });
}

/**
 * Add a row into the history.
 * Will make sure it's inserted sorted by its height.
 * @param {Object} newRow row coming from history.buildHistoryRow
 * Will return -1 if row is confirmed, -2 if still not confirmed, -3 if already was confirmed
 * @return {Number} 0 if inserted, 1 confirmed, 2 still not confirmed, 3 was already confirmed
 * @private
 */
History.prototype.addHistoryRow = function(newRow) {
    // Look for repeated element
    for(var idx=this.history.length-1; idx>=0; idx--) {
        var row = this.history[idx];
        if (row.hash == newRow.hash) {
            // replace by new row
            this.history[idx] = newRow;
            // set return code depending on status
            if (!row.height && newRow.height) {
                return 1; // confirmed
            } else if (!row.height && !newRow.height) {
                return 2; // still not confirmed
            } else {
                // keep initial height
                this.history[idx].height = row.height;
                return 3; // already confirmed
            }
        }
    }
    // Not found so insert
    this.history.push(newRow);
    return 0;
};

/**
 * Add impact for input or output to an impact dictionary.
 * @private
 */
History.prototype.addPocketImpact = function(impact, pocketId, outPocketType, amount) {
    if (!impact.hasOwnProperty(pocketId)) {
        impact[pocketId] = {ins: 0, outs: 0, total: 0, type: outPocketType};
    }
    if (amount > 0) {
        impact[pocketId].outs += amount;
    } else {
        impact[pocketId].ins -= amount;
    }
    impact[pocketId].total += amount;
};

/**
 * Build a history row from a transaction.
 * Will find out which inputs and outputs correspond to the identity wallet and calculate impact.
 * @param {String} transaction Transaction in serialized form
 * @param {Number} height Height for the transaction
 * @return {Object} The new row
 */
History.prototype.buildHistoryRow = function(transaction, height) {
    var identity = this.identity,
        btcWallet = identity.wallet.wallet,
        outAddresses = [],
        inMine = 0,
        txAddr = "",
        txObj = Bitcoin.Transaction.fromHex(transaction);
    var txHash = txObj.getId();

    var pocketImpact = {};

    var inAddress;

    // Check inputs
    for(var idx=0; idx<txObj.ins.length; idx++) {
        var anIn = txObj.ins[idx];
        var outIdx = Bitcoin.bufferutils.reverse(anIn.hash).toString('hex')+":"+anIn.index;
        var output = btcWallet.outputs[outIdx];
        var inWalletAddress = null;
        if (output) {
            inWalletAddress = identity.wallet.getWalletAddress(output.address);
            if (!inWalletAddress) {
                console.log("Address not available for output: " + output.address);
            }
        }
        if (inWalletAddress) {
            // save in pocket
            var inPocket = identity.wallet.pockets.getAddressPocketId(inWalletAddress);
            var inPocketType = identity.wallet.pockets.getPocketType(inWalletAddress.type);
            // counters
            this.addPocketImpact(pocketImpact, inPocket, inPocketType, -output.value);
            inMine += 1;
        } else {
            try {
                if (!inAddress) {
                    var address = BtcUtils.getInputAddress(anIn, this.identity.wallet.versions);
                    inAddress = address || inAddress;
                }
            } catch (e) {
                console.log("error decoding input", anIn);
            }
        }
    }
    if (!inMine) {
        txAddr = inAddress || 'unknown';
    }
    // Check outputs
    for(var idx=0; idx<txObj.outs.length; idx++) {
        var outAddress = "";
        var anOut = txObj.outs[idx];
        try {
            outAddress = Bitcoin.Address.fromOutputScript(anOut.script, Bitcoin.networks[this.identity.wallet.network]).toString();
        } catch(e) {
            continue;
        }
        var outWalletAddress = identity.wallet.getWalletAddress(outAddress);
        if (outWalletAddress) {
            var output = btcWallet.outputs[txHash+":"+idx];
            if (outAddresses.indexOf(outWalletAddress.address) == -1) {
                outAddresses.push(outWalletAddress.address);
            }
            var outPocket = identity.wallet.pockets.getAddressPocketId(outWalletAddress);
            var outPocketType = identity.wallet.pockets.getPocketType(outWalletAddress.type);
            this.addPocketImpact(pocketImpact, outPocket, outPocketType, anOut.value);
        } else {
            if (inMine) {
                txAddr = outAddress;
            }
        }
    }
    // Create a row representing this change (if already referenced will
    // be replaced)
    this.identity.txdb.setHeight(txHash, height);
    this.identity.txdb.setImpact(txHash, pocketImpact);
    this.identity.txdb.setOutAddresses(txHash, outAddresses);
    this.identity.txdb.setAddress(txHash, txAddr);

    // Start row
    return new HistoryRow(txHash, this.identity, txObj)
};

/**
 * Callback to fill missing input (depending on another transaction)
 * @param {Object} transaction Transaction in serialized form.
 * @param {Object} data        DOCME
 * @private
 */
History.prototype.fillInput = function(transaction, data) {
    var address,
        index = data[0],
        newRow = data[1],
        txObj = Bitcoin.Transaction.fromHex(transaction);
    try {
        address = Bitcoin.Address.fromOutputScript(txObj.outs[index].script, Bitcoin.networks[this.identity.wallet.network]);
    } catch(e) {
    }
    if (address) {
        newRow.address = address.toString();
        this.update();
    } else {
        // TODO: need to handle this better
        console.log("output not recognized:", txObj.outs[index]);
    }
};

/**
 * Callback for fetching a transaction
 * @param {Object} transaction   Transaction in serialized form.
 * @param {Number} height        Height of the block.
 * @return {Object|null}         DOCME
 * @private
 */
History.prototype.txFetched = function(transaction, height) {
    var self = this,
        newRow = this.buildHistoryRow(transaction, height);

    // unknown for now means we need to fill in some extra inputs for now get 1st one
    if (newRow.address == 'unknown') {
        if (newRow.tx.ins[0])
            this.identity.txdb.fetchTransaction(Bitcoin.bufferutils.reverse(newRow.tx.ins[0].hash).toString('hex'),
                                            function(_a, _b) {self.fillInput(_a, _b);},
                                            [newRow.tx.ins[0].index, newRow]);
        else {
            console.log("No input!", newRow.tx);
        }
     }
    if (this.addHistoryRow(newRow) < 2) {
        // It's a relevant event so return the row (initial unspent or initial confirm)
        return newRow;
    }
};

/**
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
            // fetch a row for the spend
            txdb.fetchTransaction(inTxHash, function(_a, _b) {self.txFetched(_a, _b);}, tx[6]);
        }
        // fetch a row for the incoming tx
        txdb.fetchTransaction(outTxHash, function(_a, _b) {self.txFetched(_a, _b);}, tx[2]);
    });
};

/**
 * Update callback, needs to be filled in by the application to register.
 */
History.prototype.update = function() {
    console.log("Program needs to register an update callback!");
};

return History;
});
