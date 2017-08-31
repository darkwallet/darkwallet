'use strict';

define(['util/stealth', 'bitcoinjs-lib', 'model/multisig', 'model/pockets', 'util/btc', 'model/output'],
function(Stealth, Bitcoin, MultisigFunds, Pockets, BtcUtils, Output) {
/**
 * Access to the identity bitcoin keys.
 * @param {Object} store Store for the object.
 * @param {Object} identity Identity for the object.
 * @constructor
 */
function Wallet(store, identity) {
    this.identity = identity;
    this.store = store;
    this.network = store.init('network', 'bitcoin');
    this.initVersions(this.network);
    this.fee = store.init('fee', Bitcoin.networks[this.network].feePerKb); // 0.1 mBTC
    this.pubKeys = store.init('pubkeys', {});
    this.scanKeys = store.init('scankeys', []);
    this.oldScanKeys = store.get('old-scankeys');
    this.idKeys = store.init('idkeys', []);
    this.dust = Bitcoin.networks[this.network].dustThreshold;
    this.addresses = {};

    this.mpk = store.get('mpk');
    this.oldMpk = store.get('old-mpk');

    // internal bitcoinjs-lib wallet to keep track of utxo (for now)
    this.multisig = new MultisigFunds(store, identity, this);
    this.pockets = new Pockets(store, identity, this);
    this.wallet = { addresses: [], outputs: {}, _outputs: store.init('outputs', []) };

    // Load pubkeys and outputs
    this.loadPubKeys();
    this.loadOutputs();

    // store balance
    this.balance = this.getBalance();
}

Wallet.prototype.initVersions = function(network) {
    this.versions = {
        address: Bitcoin.networks[network].pubKeyHash,
        network: network,
        p2sh: Bitcoin.networks[network].scriptHash,
        hd: Bitcoin.networks[network].bip32
    };
    switch(network) {
        case 'bitcoin':
            this.versions.stealth = {address: Stealth.version, nonce: Stealth.nonceVersion, prefix: 'v'};
            this.versions.pcode = {address: 47, prefix: 'P'};
            break;
        case 'testnet':
            this.versions.stealth = {address: Stealth.testnet, nonce: Stealth.nonceVersion, prefix: 'w'};
            this.versions.pcode = {address: 47, prefix: 'P'};
            break;
    }
};


/**
 * Initialize addresses for the wallet if empty
 */
Wallet.prototype.initIfEmpty = function() {
    var self = this;
    // If empty generate two addresses and one change for each initial pocket
    if (!Object.keys(this.pubKeys).length) {
        this.pockets.hdPockets.forEach(function (pocket, i) {
            self.getAddress([i, 0, 0]);
            self.getAddress([i, 0, 1]);
            self.getAddress([i, 1, 0]);
        });
        self.store.save();
    }
};

/**
 * Get addresses for given pocket / chain index.
 * @param {String|undefined} pocket Chain number, multisig id or all pockets if undefined
 * @param {Array} Array with addresses
 */
Wallet.prototype.getPocketAddresses = function(pocketId, type) {
    var allAddresses = [];

    if (pocketId === undefined || pocketId === 'all') {
        // All
        var keys = Object.keys(this.pubKeys);
        for(var i=0; i<keys.length; i++) {
            // don't add fund or readonly addresses to total funds
            if (['multisig', 'readonly'].indexOf(this.pubKeys[keys[i]].type) === -1) {
                allAddresses.push(this.pubKeys[keys[i]].address);
            }
        }
    } else{
        // Standard pocket
        allAddresses = this.pockets.getAddresses(pocketId, type);
    }
    return allAddresses;

};

/**
 * Get balance for a specific pocket or all pockets
 * @param {String|undefined} pocket Pocket number or all pockets if undefined
 * @param {Number} Balance in satoshis
 */
Wallet.prototype.getBalance = function(pocketId, type) {
    var confirmed = 0;
    var unconfirmed = 0;
    var current = 0;

    var allAddresses = this.getPocketAddresses(pocketId, type);

    // Get balance directly from available outputs
    var outputs = this.wallet.outputs;
    var keys = Object.keys(outputs);
    for(var i=0; i<keys.length; i++) {
        var out = outputs[keys[i]];
        if (allAddresses.indexOf(out.address) !== -1) {
            if (out.spend && (out.spendheight === 0)) {
                unconfirmed -= out.value;
            } else if (out.spend) {
                // spent so don't count it
            } else if (!out.height) {
                // add current balance, but not to confirmed
                if (this.identity.tx.inputsMine(out.receive.split(":")[0], null, this)) {
                    current += out.value;
                }
                // hot change also gets added to cancel unconfirmed from the spend
                unconfirmed += out.value;
            }
            else {
                confirmed += out.value;
                current += out.value;
            }
        }
    }
    var balances = {confirmed: confirmed, unconfirmed: unconfirmed, current: current};
    
    if (pocketId === undefined) {
        this.balance = balances;
    }
    return balances;
};

Wallet.prototype.resetHistory = function() {
    console.log("Reseting history");
    var self = this;
    // delete address.outputs
    Object.keys(this.pubKeys).forEach(function(seq) {
        var walletAddress = self.pubKeys[seq];
        walletAddress.outputs = [];
        walletAddress.nOutputs = 0;
        walletAddress.balance = 0;
        walletAddress.height = 0;
    });
    // delete store outputs
    this.store.set('outputs', []);
    this.wallet._outputs = this.store.get('outputs');

    // delete wallet outputs
    Object.keys(this.wallet.outputs).forEach(function(outId) {
        // No need to delete from _outputs here since we just
        // wiped it out
        delete self.wallet.outputs[outId];
    });
    
    // delete history
    this.identity.history.history = [];

    // delete tx metadata
    Object.keys(this.identity.txdb.transactions).forEach(function(txId) {
        [2, 3, 4, 5].forEach(function(idx) {
            delete self.identity.txdb.transactions[txId][idx];
        });
    });
    this.store.save();
};

Wallet.prototype.deleteOutput = function(outId) {
    var output = this.wallet.outputs[outId];
    // delete from actual store
    var storeIndex = this.wallet._outputs.indexOf(output.store);
    if (storeIndex > -1) {
        this.wallet._outputs.splice(storeIndex, 1);
    } else {
        // shouldn't happen
        console.log("warning: output store does not exist");
    }
    delete this.wallet.outputs[outId];
}

Wallet.prototype.loadOutputs = function() {
    var self = this;
    // Load outputs
    this.wallet._outputs.forEach(function(output) {
        self.wallet.outputs[output[0]] = new Output(output);
        var walletAddress = self.getWalletAddress(output[2]);
        if (walletAddress && walletAddress.outputs.indexOf(output[0]) === -1) {
            walletAddress.outputs.push(output[0]);
        }
    });
};


/**
 * Load wallet addresses into internal Bitcoin.Wallet
 * @private
 */
Wallet.prototype.loadPubKeys = function() {
    var self = this;

    Object.keys(this.pubKeys).forEach(function(index) {
        var walletAddress = self.pubKeys[index];

        // Cleanup if malformed
        if (!walletAddress){
            console.log("delete empty address", index);
            delete self.pubKeys[index];
            return;
        }
        if (walletAddress.type === 'hd' || walletAddress.type === 'stealth') {
            if (typeof walletAddress.index[0] === 'string') {
                walletAddress.index[0] = parseInt(walletAddress.index[0]);
                console.log("[wallet] fixed address " + walletAddress.index, walletAddress.index);
            }
        }

        // Add all to the wallet
        self.wallet.addresses.push(walletAddress.address);
        self.pockets.addToPocket(walletAddress);
        self.addresses[walletAddress.address] = walletAddress;

        // TODO: Don't process previous history so we can cache
        // properly later
        if (walletAddress.history) {
              // Reload history
              walletAddress.balance = 0;
              walletAddress.nOutputs = 0;
              walletAddress.height = 0;
              delete walletAddress.history;
              // self.processHistory(walletAddress, walletAddress.history, true);
        }
        if (!walletAddress.outputs) {
           walletAddress.outputs = [];
        }
    });

    // Initialize if empty before creating pocket keys
    this.initIfEmpty();
    return false; // updated
};

/**
 * Get the private key for the given address index
 * @param {Object} walletAddress walletAddress to retrieve the private key for
 * @param {String} password Password to encrypt the private data
 * @param {Function} callback A callback where the private key will be provided.
 */
Wallet.prototype.getPrivateKey = function(walletAddress, password, callback) {
    var seq = walletAddress.index;
    // First try from cache
    var data = this.store.getPrivateData(password);
    if (data.privKeys[seq]) {
        var key = Bitcoin.ECKey.fromBytes(data.privKeys[seq], true);
        callback(key);
        return;
    }
    // Otherwise get it from the pocket directly
    var pocket = this.pockets.getAddressPocket(walletAddress);
    pocket.getPrivateKey(walletAddress, password, data, callback);
};

/**
 * Store the given private key
 * @param {Array} seq Address sequence (bip32 or stealth id)
 * @param {String} password Password to decrypt the private data
 * @param {Bitcoin.ECKey} key Private key to store
 */
Wallet.prototype.storePrivateKey = function(seq, password, key) {
    seq = seq.slice(0);
    var data = this.store.getPrivateData(password);
    data.privKeys[seq] = key.toBytes();
    this.store.setPrivateData(data, password);
};

/**
 * Store the given public key as a wallet address
 * @param {Array} seq Address sequence (bip32 or stealth id)
 * @param {Bitcoin.ECKey} key Bitcoin.ECKey or public key bytes
 * @return {Object} the wallet address
 */
Wallet.prototype.storePublicKey = function(seq, key, properties) {
    var pubKey = key.length ? key : key.toBytes();

    var pubKeyHash = Bitcoin.crypto.hash160(new Bitcoin.Buffer(pubKey));
    var address = new Bitcoin.Address(pubKeyHash, this.versions.address);

    var label = 'unused';

    var walletAddress = {
       'index': seq.slice(0),
       'label': label,
       'balance': 0,
       'nOutputs': 0,
       'height': 0,
       'pubKey': pubKey,
       'address': address.toString()
    };

    // Merge properties
    if (properties) {
        for (var attrname in properties) {
            walletAddress[attrname] = properties[attrname];
        }
    }

    // add to internal bitcoinjs-lib wallet
    this.addToWallet(walletAddress);
    return walletAddress;
};

/**
 * Add an address to the wallet
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}.
 */
Wallet.prototype.addToWallet = function(walletAddress) {
    this.addresses[walletAddress.address] = walletAddress;
    this.wallet.addresses.push(walletAddress.address);
    this.pubKeys[walletAddress.index.slice()] = walletAddress;
    this.pockets.addToPocket(walletAddress);
    this.store.save();
};

/**
 * Delete an address from the wallet
 * @param {Array} seq Array for the bip32 sequence to retrieve address for
 * @private - should be called from the pocket
 */
Wallet.prototype.deleteAddress = function(seq) {
    // Addresses should be cleaned up from their pocket not from here (unlees they are not in a pocket)
    var walletAddress = this.pubKeys[seq];
    this.wallet.addresses.splice(this.wallet.addresses.indexOf(walletAddress.address), 1);
    delete this.pubKeys[seq];
    delete this.addresses[walletAddress.address];

    // Delete related outputs
    var self = this;
    Object.keys(this.wallet.outputs).forEach(function(outputId) {
        var output = self.wallet.outputs[outputId];
        if (output.address === walletAddress.address) {
            self.deleteOutput(output);
        }
    });
};

/**
 * Get an address from this wallet.
 * @param {Array} seq Array for the bip32 sequence to retrieve address for
 * @param {String} label Default label for the address (optional)
 */
Wallet.prototype.getAddress = function(seq, label) {
    if (this.pubKeys[seq]) {
        return this.pubKeys[seq];
    }
    else {
        var pocket;
        if (this.store.get('version') > 4 && seq.length !== 2) {
            pocket = this.pockets.getPocket(seq[0], 'hd');
        } else {
            pocket = this.pockets.getPocket(Math.floor(seq[0]/2), 'hd');
        }
        return pocket.createAddress(seq, label);
    }
};


/**
 * Get the wallet address structure for an address.
 * The structure has the following fields:
 *   index: bip32 sequence
 *   label: label
 *   balance: satoshis
 *   nOutputs: number of outputs
 *   address: address hash
 *   
 * @param {String} address Bitcoin address
 * @return {Object} The wallet address structure
 */
Wallet.prototype.getWalletAddress = function(address) {
    return this.addresses[address];
    var keys = Object.keys(this.pubKeys);
    for (var idx=0; idx<keys.length; idx++) {
         var walletAddress = this.pubKeys[keys[idx]];
         if (walletAddress.address === address) {
             return walletAddress;
         }
    }
};


/**
 * Set the default fee
 * @param {String} The new fee in satoshis
 */
Wallet.prototype.setDefaultFee = function(newFee) {
    this.fee = newFee;
    this.store.set('fee', newFee);
    this.store.save();
    console.log("[wallet] saved new fees", newFee);
};


/**
 * Get available unspent outputs for paying from the given pocket.
 * @param {Number} value The amount to look for in satoshis
 * @param {Object} pocketId The pocket identifier
 * @return {Object} List of outputs
 */
Wallet.prototype.getUtxoToPay = function(value, pocketId, type) {
    var tmpWallet, dust=this.dust;
    if (pocketId === 'all') {
        tmpWallet = this.wallet;
    } else {
        tmpWallet = this.pockets.getPocketWallet(pocketId, type);
    }

    var valueMatch = function(a, b) {
         // Make sure change isn't below dust threshold.
         if (a == b || a >= (b+dust)) { return true; }
         return false;
    };

    var getCandidateOutputs = function(w, value, hot) {
        var h = [];
        for (var out in w.outputs) { h.push(w.outputs[out]); }
        // remove spent
        var utxo = h.filter(function(x) { return !x.spend; });

        // remove unconfirmed (leave hot change if 'hot' is true)
        utxo = utxo.filter(function(x) { return (x.height || (hot&&x.change)); });

        // a.value < b.value does a fuzzy ordering here, using '-' enforces good order
        var valuecompare = function(a,b) { return a.value - b.value; };
        var high = utxo.filter(function(o) { return valueMatch(o.value, value); })
                       .sort(valuecompare);
        if (high.length > 0) { return [high[0]]; }
        // here sort bigger first
        utxo.sort(function(a, b) { return b.value - a.value; });
        var totalval = 0;
        for (var i = 0; i < utxo.length; i++) {
            totalval += utxo[i].value;
            if (valueMatch(totalval, value)) { return utxo.slice(0,i+1); }
        }
        // if looking without hot and didn't find any, look for hot also
        if (!hot) {
            return getCandidateOutputs(w, value, true);
        }
        throw ("Not enough money to send funds including transaction fee. Have: "
                     + (totalval / 100000000) + ", needed: " + (value / 100000000));
   };

   return getCandidateOutputs(tmpWallet, value);
};


/**
 * Process an output from an external source
 * See Bitcoin.Wallet.processOutput
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}
 * @param {String} txHash
 * @param {String} index
 * @param {Number} value
 * @param {Number} height
 * @param {Object} spend
 */
Wallet.prototype.processOutput = function(walletAddress, txHash, index, value, height, spend, spendheight) {
    // Wallet wide
    var wallet = this.wallet;
    var outId = txHash+":"+index;
    var output = wallet.outputs[outId];
    // If it doesn't exist create a new one
    if (!output) {
        var store = [];
        wallet._outputs.push(store);
        output = new Output(store, outId, value, walletAddress.address);
        wallet.outputs[outId] = output;
        walletAddress.nOutputs += 1;
        if (!walletAddress.outputs) {
            walletAddress.outputs = [];
        }
        if (walletAddress.outputs.indexOf(outId) === -1) {
            walletAddress.outputs.push(outId);
        }
    }
    // If confirmed or inputs are mine and not spent add balance
    if (height && !spend && !output.counted) {
        // Add if we didn't add it yet
        walletAddress.balance += value;
        output.counted = true;
    }
    if (walletAddress.type === 'stealth') {
        output.stealth = true;
    }
    // Save height
    if (!output.height) {
        output.height = height;
    }

    // If it's a spend save the next output and spend height
    if (spend) {
        output.markSpend(spend, spendheight)
    }
};

/**
 * Process history report from obelisk
 * @param {Object} walletAddress Wallet address structure. See {@link Wallet#getWalletAddress}
 * @param {Array} history
 */
Wallet.prototype.processHistory = function(walletAddress, history, initial) {
    var self = this;

    // only supported getting (and caching) all history for now
    // walletAddress.history = history;

    // process history
    history.forEach(function(tx) {
        // sum unspent outputs for the address
        var outTxHash = tx[0];
        var inTxHash = tx[4];
        var outHeight = tx[2];
        var spend;
        if (!inTxHash) {
            if (outHeight) {
                walletAddress.height = Math.max(outHeight, walletAddress.height);
            }
        } else {
            walletAddress.height = Math.max(tx[6]||outHeight, walletAddress.height);
            spend = inTxHash + ":" + tx[5];
        }
        // pass on to internal Bitcoin.Wallet
        self.processOutput(walletAddress, outTxHash, tx[1], tx[3], outHeight, spend, tx[6]);
    });
    if (!initial && history.length) {
        this.store.save();
    }
};

/**
 * Get the stealth scanning ECKey
 * @param {Number} n key index
 * @return {Object} The scanning key
 */
Wallet.prototype.getScanKey = function(n, oldStyle) {
    var scanMaster;
    if (this.store.get('version') > 4 && oldStyle) {
        // old stealth address on a new identity
        scanMaster = this.oldScanKeys[0];
    } else {
        scanMaster = this.scanKeys[0];
    }
    var scanMasterKey = Bitcoin.HDNode.fromBase58(scanMaster.priv);
    var childKey = scanMasterKey.derive(n);
    return childKey.privKey;
};

/**
 * Get the identity ECKey
 * @param {Number} n key index
 * @return {Object} The scanning key
 */
Wallet.prototype.getIdentityKey = function(n) {
    n = n || 0;
    var idMaster = this.idKeys[0];
    var idMasterKey = Bitcoin.HDNode.fromBase58(idMaster.priv);
    var childKey = idMasterKey.derive(n);
    return childKey.privKey;
};

/**
 * Process a stealth match by generating a wallet address
 * The array comes 
 * @param {Number} pocketIndex The pocket index
 * @param {Array} ephemKey Ephemeral key as bytes
 * @param {Array} pubKey Public key as bytes
 * @param {String} Address resulting address as string
 */
Wallet.prototype.processStealthMatch = function(pocketIndex, ephemKey, pubKey, address, quirk) {
    var branchId = this.store.get('version') > 4 ? pocketIndex : pocketIndex*2;
    var seq = [branchId, 's'].concat(ephemKey);
    var walletAddress = this.pubKeys[seq];

    // If we don't have an address, create it.
    if (!walletAddress) {
        walletAddress = this.storePublicKey(seq, pubKey, {'type': 'stealth', 'ephemKey': ephemKey, 'address': address, 'quirk': quirk});
    }
    // Quirk is a workaround for bad stealth secret introduced on 0.4.0
    if (quirk && !walletAddress.quirk) {
        walletAddress.quirk = quirk;
        this.store.save();
    }
    return walletAddress;
};

/**
 * Search for an address
 */
Wallet.prototype.searchAddress = function(search) {
    var label = Object.keys(search)[0];
    var value = search[label];
    var keys = Object.keys(this.pubKeys);
    for(var i=0; i<keys.length; i++) {
        var seq = keys[i];
        if (this.pubKeys[seq][label] === value) {
            return this.pubKeys[seq];
        }
    }
};

/**
 * Check for new derived stealth address
 */
Wallet.prototype.checkNewStealth = function(recipient, address, ephemKey, pubKey) {
    var pocketAddress = this.searchAddress({'stealth': recipient});
    if (pocketAddress) {
        var seq = [pocketAddress.index[0], 's'].concat(ephemKey);
        var addrData = {'type': 'stealth', 'ephemKey': ephemKey, 'address': address, 'quirk': false};
        var walletAddress = this.storePublicKey(seq, pubKey, addrData);
        return walletAddress;
    }
};

return Wallet;
});
