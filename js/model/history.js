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
 * @param {String} transaction Transaction in serialized form
 * @param {Number} height Height for the transaction
 * @return {Object} The new row
 */
History.prototype.buildHistoryRow = function(transaction, height) {
    var identity = this.identity,
        btcWallet = identity.wallet.wallet,
        inMine = 0,
        outMine = 0,
        myInValue = 0,
        myOutValue = 0,
        txAddr = "",
        txObj = Bitcoin.Transaction.fromHex(transaction);
    var isStealth = false;
    var txHash = txObj.getId();

    var pocketImpact = {};
    var addPocketImpact = function(pocketId, outPocketType, amount) {
        if (!pocketImpact.hasOwnProperty(pocketId)) {
            pocketImpact[pocketId] = {ins: 0, outs: 0, total: 0, type: outPocketType};
        }
        if (amount > 0) {
            pocketImpact[pocketId].outs += amount;
        } else {
            pocketImpact[pocketId].ins -= amount;
        }
        pocketImpact[pocketId].total += amount;
    };

    var inAddress, inPocket, outPocket, internal;

    // Check inputs
    for(var idx=0; idx<txObj.ins.length; idx++) {
        var anIn = txObj.ins[idx];
        var outIdx = Bitcoin.bufferutils.reverse(anIn.hash).toString('hex')+":"+anIn.index;
        if (btcWallet.outputs[outIdx]) {
            var output = btcWallet.outputs[outIdx];
            // save in pocket
            var inWalletAddress = identity.wallet.getWalletAddress(output.address);
            inPocket = identity.wallet.pockets.getAddressPocketId(inWalletAddress);
            var inPocketType = identity.wallet.pockets.getPocketType(inWalletAddress.type);
            // counters
            inMine += 1;
            myInValue += output.value;
            addPocketImpact(inPocket, inPocketType, -output.value);
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
        var outAddress;
        var anOut = txObj.outs[idx];
        try {
            outAddress = Bitcoin.Address.fromOutputScript(anOut.script, Bitcoin.networks[this.identity.wallet.network]);
        } catch(e) {
            outAddress = "";
        }
        var outWalletAddress = identity.wallet.getWalletAddress(outAddress.toString());
        if (outWalletAddress) {
            var output = btcWallet.outputs[txHash+":"+idx];
            // TODO: mark also when input is mine and output not
            if (output && output.stealth) {
                isStealth = true;
            }
            outMine += 1;
            myOutValue += anOut.value;
            var _outPocket = identity.wallet.pockets.getAddressPocketId(outWalletAddress);
            var outPocketType = identity.wallet.pockets.getPocketType(outWalletAddress.type);
            // save out pocket (don't set if it's change or same as input)
            if (inPocket !== _outPocket && !((typeof outWalletAddress.index[0] === 'number') && (outWalletAddress.index[0]%2 == 1))) {
                outPocket = _outPocket;
            }
            addPocketImpact(_outPocket, outPocketType, anOut.value);
        } else {
            if (inMine) {
                txAddr = outAddress.toString();
            }
        }
    }
    if (!txAddr) {
        txAddr = this.getTransferLabel(pocketImpact);
        internal = true;
    }
    // Create a row representing this change (if already referenced will
    // be replaced)
    var newRow = {hash: txHash, tx: txObj, inMine: inMine, outMine: outMine, myInValue: myInValue, myOutValue: myOutValue, height: height, address: txAddr, isStealth: isStealth, total: myOutValue-myInValue, outPocket: outPocket, inPocket: inPocket, impact: pocketImpact, label: this.identity.txdb.getLabel(txHash), internal: internal};
    return newRow;
};

History.prototype.getTransferLabel = function(pocketImpact) {
    var identity = this.identity;
    var keys = Object.keys(pocketImpact);

    // Input pockets
    var inKeys = keys.filter(function(key) { return pocketImpact[key].ins!==0; } );
    inKeys = inKeys.map(function(key) { return identity.wallet.pockets.getPocket(key, pocketImpact[key].type).name; });

    // Output pockets (minus change pockets)
    var outKeys = keys.filter(function(key) { return pocketImpact[key].outs!==0 && pocketImpact[key].ins===0; } );
    outKeys = outKeys.map(function(key) { return identity.wallet.pockets.getPocket(key, pocketImpact[key].type).name; });

    // Compose the final label
    var label = inKeys.join(' ,');
    if (outKeys.length) {
        return label + " to " + outKeys.join(' ,');
    } else {
        return 'internal on ' + label;
    }
}

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
            this.identity.txdb.fetchTransaction(Bitcoin.bufferutils.reverse(newRow.tx.ins[0]).hash.toString('hex'),
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
