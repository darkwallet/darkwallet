'use strict';

define(['bitcoinjs-lib', 'util/btc'], function(Bitcoin, BtcUtils) {

/**
 * HistoryRow properties and data.
 * @param {String} hash Transaction hash this row references
 * @param {Identity} Identity for this row
 * @param {Transaction} Transaction object if available (optional)
 * @constructor
 */
function HistoryRow(hash, identity, txObj) {
    this.identity = identity;
    this._tx = txObj;
    this.hash = hash;
    this.outAddresses = identity.txdb.getOutAddresses(hash).map(function(address) {
        return identity.wallet.getWalletAddress(address);}).filter(function(address){return address !== undefined;
    });
    this.isStealth = this.outAddresses.some(function(walletAddress) { return walletAddress && walletAddress.type === 'stealth';});
}

/**
 * Generate a label for the pocket (pocketA to pocketB format)
 * @private
 */
HistoryRow.prototype.getTransferLabel = function() {
    var identity = this.identity;
    var pocketImpact = this.impact;
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
};

/**
 * Loaded transaction object (Bitcoin.Transaction)
 */
Object.defineProperty(HistoryRow.prototype, 'tx', {
    get: function() {
        if (!this._tx) {
            var txBody = this.identity.txdb.getBody(this.hash);
            this._tx = Bitcoin.Transaction.fromHex(txBody);
        }
        return this._tx;
    }
});

/**
 * Any inputs are mine (Boolean)
 */
Object.defineProperty(HistoryRow.prototype, 'inMine', {
    get: function() { return this.myInValue>0; }
});

/**
 * Formatted heuristic origin or destination address (String)
 */
Object.defineProperty(HistoryRow.prototype, 'address', {
    // TODO: Probably don't want this here any more!
    get: function() {
        var addressLabel = this.identity.txdb.getAddress(this.hash);
        if (addressLabel) {
            return addressLabel;
        } else {
            return this.getTransferLabel();
        }
    },
    set: function(val) { this.identity.txdb.setAddress(this.hash, val); }
});

/**
 * Total outgoing value (Number)
 */
Object.defineProperty(HistoryRow.prototype, 'total', {
    get: function() { return this.myOutValue-this.myInValue; }
});

/**
 * First out pocket (String)
 */
Object.defineProperty(HistoryRow.prototype, 'outPocket', {
    get: function() {
        var impactkeys = Object.keys(this.impact);
        for(var i=0; i<impactkeys.length; i++) {
            if (this.impact[impactkeys[i]].outs && this.impact[impactkeys[i]].outs > this.impact[impactkeys[i]].ins) {
                if (this.impact[impactkeys[i]].type == 'hd') {
                    return parseInt(impactkeys[i]);
                } else {
                    return impactkeys[i];
                }
            }
        }
    }
});

/**
 * First in pocket (String)
 */
Object.defineProperty(HistoryRow.prototype, 'inPocket', {
    get: function() {
        var impactkeys = Object.keys(this.impact);
        for(var i=0; i<impactkeys.length; i++) {
            // TODO: should think about change in this comparison
            if (this.impact[impactkeys[i]].ins && this.impact[impactkeys[i]].ins > this.impact[impactkeys[i]].outs) {
                if (this.impact[impactkeys[i]].type == 'hd') {
                    return parseInt(impactkeys[i]);
                } else {
                    return impactkeys[i];
                }

            }
        }
    }
});

/**
 * User set label for the transaction (String)
 */
Object.defineProperty(HistoryRow.prototype, 'label', {
    get: function() { return this.identity.txdb.getLabel(this.hash); },
    set: function(val) { return this.identity.txdb.setLabel(this.hash, val); }
});

/**
 * Per pocket impact for the transaction (Object)
 */
Object.defineProperty(HistoryRow.prototype, 'impact', {
    get: function() { return this.identity.txdb.getImpact(this.hash); }
});

/**
 * Is the transaction internal?
 */
Object.defineProperty(HistoryRow.prototype, 'internal', {
    get: function() { return (this.myInValue === this.myOutValue); }
});

/**
 * bareid for the transactiona (String)
 * (hash of the transaction without signatures)
 */
Object.defineProperty(HistoryRow.prototype, 'bareid', {
    get: function() {
        if (!this._bareid) {
            this._bareid = BtcUtils.getBareTxId(this.tx);
        }
        return this._bareid;
    }
});

/**
 * Total value of my inputs (Number)
 */
Object.defineProperty(HistoryRow.prototype, 'myInValue', {
    get: function() {
        var res = 0;
        var impactkeys = Object.keys(this.impact);
        for(var i=0; i<impactkeys.length; i++) {
            res += this.impact[impactkeys[i]].ins;
        }
        return res;

    }
});

/**
 * Total value of my outputs (Number)
 */
Object.defineProperty(HistoryRow.prototype, 'myOutValue', {
    get: function() {
        var res = 0;
        var impactkeys = Object.keys(this.impact);
        for(var i=0; i<impactkeys.length; i++) {
            res += this.impact[impactkeys[i]].outs;
        }
        return res;

    }
});

/**
 * Height for this row in the blockchain (Number)
 */
Object.defineProperty(HistoryRow.prototype, 'height', {
    // TODO: getHeight not implemented yet...
    get: function() { return this.identity.txdb.getHeight(this.hash); },
    set: function(val) { return this.identity.txdb.setHeight(this.hash, val); }
});

return HistoryRow;
});
