'use strict';

define(['bitcoinjs-lib', 'util/btc'], function(Bitcoin, BtcUtils) {

/**
 * User oriented history view.
 * @param {Object} store Store for the object.
 * @param {Object} identity Parent identity for the object
 * @constructor
 */
function History(store, identity) {
    this.history = [];
    this.identity = identity;
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
 * Build a history row from a transaction.
 * Will find out which inputs and outputs correspond to the identity wallet and calculate impact.
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}
 * @param {String} transaction Transaction in serialized form
 * @param {Number} height Height for the transaction
 * @return {Object} The new row
 */
History.prototype.buildHistoryRow = function(walletAddress, transaction, height) {
    var identity = this.identity,
        btcWallet = identity.wallet.wallet,
        inMine = 0,
        outMine = 0,
        myInValue = 0,
        myOutValue = 0,
        txAddr = "",
        txObj = new Bitcoin.Transaction(transaction);
    var isStealth = false;
    var txHash = Bitcoin.convert.bytesToHex(txObj.getHash());

    // XXX temporary while bitcoinjs-lib supports testnet better
    txObj = BtcUtils.fixTxVersions(txObj, this.identity);

    var inAddress, inPocket, outPocket;

    // Check inputs
    for(var idx=0; idx<txObj.ins.length; idx++) {
        var anIn = txObj.ins[idx];
        var outIdx = anIn.outpoint.hash+":"+anIn.outpoint.index;
        if (btcWallet.outputs[outIdx]) {
            inMine += 1;
            var output = btcWallet.outputs[outIdx];
            myInValue += output.value;
            // save in pocket
            var inWalletAddress = identity.wallet.getWalletAddress(output.address);
            inPocket = identity.wallet.pockets.getAddressPocketId(inWalletAddress);
        } else {
            var address = BtcUtils.getInputAddress(anIn, this.identity.wallet.versions);
            inAddress = address || inAddress;
        }
    }
    if (!inMine) {
        txAddr = inAddress || 'unknown';
    }
    // Check outputs
    for(var idx=0; idx<txObj.outs.length; idx++) {
        var anOut = txObj.outs[idx];
        var outWalletAddress = identity.wallet.getWalletAddress(anOut.address.toString());
        if (outWalletAddress) {
            var output = btcWallet.outputs[txHash+":"+idx];
            // TODO: mark also when input is mine and output not
            if (output && output.stealth) {
                isStealth = true;
            }
            outMine += 1;
            myOutValue += anOut.value;
            // save out pocket
            outPocket = identity.wallet.pockets.getAddressPocketId(outWalletAddress);
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
    var newRow = {hash: txHash, tx: txObj, inMine: inMine, outMine: outMine, myInValue: myInValue, myOutValue: myOutValue, height: height, address: txAddr, isStealth: isStealth, total: myOutValue-myInValue, outPocket: outPocket, inPocket: inPocket};
    return newRow;
};


/**
 * Callback to fill missing input (depending on another transaction)
 * @param {Object} transaction Transaction in serialized form.
 * @param {Object} data        DOCME
 * @private
 */
History.prototype.fillInput = function(transaction, data) {
    var index = data[0],
        newRow = data[1],
        txObj = new Bitcoin.Transaction(transaction);
    // XXX temporary while bitcoinjs-lib supports testnet better
    txObj = BtcUtils.fixTxVersions(txObj, this.identity);
    newRow.address = txObj.outs[index].address.toString();
    this.update();
};

/**
 * Callback for fetching a transaction
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}
 * @param {Object} transaction   Transaction in serialized form.
 * @param {Number} height        Height of the block.
 * @return {Object|null}         DOCME
 * @private
 */
History.prototype.txFetched = function(walletAddress, transaction, height) {
    var self = this,
        newRow = this.buildHistoryRow(walletAddress, transaction, height);

    // unknown for now means we need to fill in some extra inputs for now get 1st one
    if (newRow.address == 'unknown') {
        if (newRow.tx.ins[0])
            this.identity.txdb.fetchTransaction(newRow.tx.ins[0].outpoint.hash,
                                            function(_a, _b) {self.fillInput(_a, _b);},
                                            [newRow.tx.ins[0].outpoint.index, newRow]);
        else
            console.log("No input!", newRow.tx);
     }
    newRow.addressIndex = walletAddress.index.slice(0);
    newRow.pocket = walletAddress.index[0];
    if (this.addHistoryRow(newRow) < 2) {
        // It's a relevant event so return the row (initial unspent or initial confirm)
        return newRow;
    }
};

/**
 * Look for transactions from given history records
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}
 * @param {Object} history History array as returned by obelisk
 */
History.prototype.fillHistory = function(walletAddress, history) {
    var self = this,
        txdb = this.identity.txdb;
    history.forEach(function(tx) {
        var outTxHash = tx[0],
            inTxHash = tx[4];
        if (inTxHash) {
            // fetch a row for the spend
            txdb.fetchTransaction(inTxHash, function(_a, _b) {self.txFetched(walletAddress, _a, _b);}, tx[6]);
        }
        // fetch a row for the incoming tx
        txdb.fetchTransaction(outTxHash, function(_a, _b) {self.txFetched(walletAddress, _a, _b);}, tx[2]);
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
