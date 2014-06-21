'use strict';

define(['util/stealth', 'bitcoinjs-lib', 'model/multisig', 'model/pockets', 'util/btc'],
function(Stealth, Bitcoin, MultisigFunds, Pockets, BtcUtils) {
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
    this.fee = store.init('fee', 10000); // 0.1 mBTC
    this.pubKeys = store.init('pubkeys', {});
    this.scanKeys = store.init('scankeys', []);
    this.idKeys = store.init('idkeys', []);

    this.mpk = store.get('mpk');

    // internal bitcoinjs-lib wallet to keep track of utxo (for now)
    this.multisig = new MultisigFunds(store, identity, this);
    this.pockets = new Pockets(store, identity, this);
    this.wallet = { addresses: [], outputs: {} };

    this.stealthCache = {};

    this.loadPubKeys();

    // store balance
    this.balance = this.getBalance();
}

Wallet.prototype.initVersions = function(network) {
    network = (network === 'bitcoin') ? 'mainnet' : network;
    this.versions = {
        address: Bitcoin.network[network].addressVersion,
        p2sh: Bitcoin.network[network].p2shVersion,
        hd: Bitcoin.network[network].hdVersions
    };
    switch(network) {
        case 'mainnet':
            this.versions.stealth = {address: Stealth.version, nonce: Stealth.nonceVersion, prefix: 'v'};
            break;
        case 'testnet':
            this.versions.stealth = {address: Stealth.testnet, nonce: Stealth.nonceVersion, prefix: 'w'};
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
            self.getAddress([i*2,0]);
            self.getAddress([i*2,1]);
            self.getAddress([(i*2)+1,0]);
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
    } else if (typeof pocketId === 'number') {
        // Hd pocket
        allAddresses = this.pockets.getAddresses(pocketId, type);
    } else if (type == 'readonly') {
        allAddresses = this.pockets.getAddresses(pocketId, type);
    } else {
        // Multisig
        allAddresses = [pocketId]; 
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
    var hot = 0;

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
                // add to balance
                if (out.change) { // hot change not allowed atm
                    confirmed += out.value;
                    hot += out.value;
                }
                current += out.value;
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

/**
 * Load wallet addresses into internal Bitcoin.Wallet
 * @private
 */
Wallet.prototype.loadPubKeys = function() {
    var self = this;
    Object.keys(this.pubKeys).forEach(function(index) {
        var walletAddress = self.pubKeys[index];

        // Add all to the wallet
        self.wallet.addresses.push(walletAddress.address);
        if (walletAddress.index.length > 1) {
            self.pockets.addToPocket(walletAddress);

            // TODO: Don't process previous history so we can cache
            // properly later
            if (walletAddress.history) {
                  // Reload history
                  walletAddress.balance = 0;
                  walletAddress.nOutputs = 0;
                  walletAddress.height = 0;
                  self.processHistory(walletAddress, walletAddress.history, true);
            }
        }
    });

    // Initialize if empty before creating pocket keys
    this.initIfEmpty();

    // Upgrade stealth addresses
    this.pockets.hdPockets.forEach(function(pocket, i) {
        var walletAddress = self.pubKeys[[i*2]];
        if (walletAddress && pocket) {
            var scanKey = self.getScanKey(i*2);
            var spendKey = walletAddress.pubKey;
            walletAddress.stealth = Stealth.formatAddress(scanKey.getPub().toBytes(), [spendKey], self.versions.stealth.address);
        }
    });
    return false; // updated
};

Wallet.prototype.deriveHDPrivateKey = function(seq, masterKey) {
    var key = masterKey;
    var workSeq = seq.slice(0);
    while(workSeq.length) {
        key = key.derive(workSeq.shift());
    }
    return key.priv;
};

Wallet.prototype.deriveStealthPrivateKey = function(seq, masterKey, keyStore) {
    var spendKey;
    var scanKey = this.getScanKey(seq[0]);
    var privData = keyStore.privKeys[seq.slice(0,1)];
    if (privData) {
        spendKey = new Bitcoin.ECKey(privData, true);
    } else {
        // stealth address take the spend key from the pocket 0
        spendKey = this.deriveHDPrivateKey(seq.slice(0,1), masterKey);
    }
    return Stealth.uncoverPrivate(scanKey.toBytes(), seq.slice(2), spendKey.toBytes());
};

/**
 * Get the master private key for a pocket
 */
Wallet.prototype.getPocketPrivate = function(index, password) {
    var data = this.store.getPrivateData(password);
    var masterKey = Bitcoin.HDWallet.fromBase58(data.privKey);
    return masterKey.derive(index).toBase58(true);
};

/**
 * Get the private key for the given address index
 * @param {Array} seq Array for the bip32 sequence to retrieve address for
 * @param {String} password Password to encrypt the private data
 * @param {Function} callback A callback where the private key will be provided.
 */
Wallet.prototype.getPrivateKey = function(seq, password, callback) {
    // clone seq since we're mangling it
    var data = this.store.getPrivateData(password);
    if (data.privKeys[seq]) {
        var key = new Bitcoin.ECKey(data.privKeys[seq], true);
        callback(key);
        return;
    }
    var masterKey = Bitcoin.HDWallet.fromBase58(data.privKey);
    var privKey;
    if (seq.length > 1 && seq[1] === 's') {
        privKey = this.deriveStealthPrivateKey(seq, masterKey, data);
    } else {
        privKey = this.deriveHDPrivateKey(seq, masterKey);
        this.storePrivateKey(seq, password, privKey);
    }
   
    callback(privKey);
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

    var pubKeyHash = Bitcoin.crypto.hash160(pubKey);
    var address = new Bitcoin.Address(pubKeyHash, this.versions.address);

    var label = 'unused';
    if (seq.length === 1) {
        label = 'pocket';
    } else if (seq.length > 1 && (seq[0]%2 === 1)) {
        label = 'change';
    } else {
        label = 'unused';
    }

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

    // Precalculate stealth address and mpk for pockets (only main branch)
    if ((seq.length === 1) && (seq[0]%2 === 0)) {
        // Stealth
        var scanKey = this.getScanKey(seq[0]);
        var stealthAddress = Stealth.formatAddress(scanKey.getPub().toBytes(), [pubKey], this.versions.stealth.address);
        walletAddress.stealth = stealthAddress;
        // Mpk
        walletAddress.mpk = BtcUtils.deriveMpk(this.mpk, seq[0]);
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
    this.wallet.addresses.push(walletAddress.address);
    this.pubKeys[walletAddress.index.slice()] = walletAddress;
    this.pockets.addToPocket(walletAddress);
    this.store.save();
};

/**
 * Delete an address from the wallet
 * @param {Array} seq Array for the bip32 sequence to retrieve address for
 * @param {Bool} dontSave Won't trigger store.save if true
 */
Wallet.prototype.deleteAddress = function(seq, dontSave) {
    var walletAddress = this.pubKeys[seq];
    this.wallet.addresses.splice(this.wallet.addresses.indexOf(walletAddress.index), 1);
    delete this.pubKeys[seq];
    // TODO: should cleanup pockets
    if (!dontSave) {
        this.store.save();
    }
};

/**
 * Get an address from this wallet.
 * @param {Array} seq Array for the bip32 sequence to retrieve address for
 */
Wallet.prototype.getAddress = function(seq) {
    if (this.pubKeys[seq]) {
        return this.pubKeys[seq];
    }
    else {
        // derive from mpk
        var mpKey = Bitcoin.HDWallet.fromBase58(this.mpk);

        var workSeq = seq.slice(0);
        var childKey = mpKey;
        while(workSeq.length) {
            childKey = childKey.derive(workSeq.shift());
        }
        return this.storePublicKey(seq, childKey.pub);
    }
};

/**
 * Get a free address from a branch id (can be pocket or pocket+1 for change)
 * @param {Array} seq Array for the bip32 sequence to retrieve address for
 * @throws {Error} When generated an incorrect change address.
 */
Wallet.prototype.getFreeAddress = function(branchIndex) {
    var walletAddress;
    if (typeof branchIndex === 'string') {
        // multisig get the same address again
        walletAddress = this.getWalletAddress(branchIndex);
        if (['multisig', 'readonly'].walletAddress.type === -1) {
           throw new Error("Generated an incorrect change address");
        }
    } else {
        // normal address, get the address
        var n = 0;
        do {
            walletAddress = this.getAddress([branchIndex, n]);
            n += 1;
        } while (walletAddress.nOutputs > 0);

        // This should have no type
        if (walletAddress.type) {
           throw new Error("Generated an incorrect change address");
        }
    }
    return walletAddress;
};

/**
 * Get a free change address for a pocket
 * @param {Object} pocketIndex Index for the pocket, can be string for
 *                 multisigs or int for a normal pocket (as usual).
 * @return {Object} The first change address
 */

Wallet.prototype.getChangeAddress = function(pocketId) {
    var branchIndex;
    if (typeof pocketId === 'string') {
        branchIndex = pocketId;
    } else {
        // Change branch
        branchIndex = (pocketId*2)+1;
    }
    return this.getFreeAddress(branchIndex);
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
    var tmpWallet;
    if (pocketId === 'all') {
        tmpWallet = this.wallet;
    } else {
        tmpWallet = this.pockets.getPocketWallet(pocketId, type);
    }

    var getCandidateOutputs = function(w, value, hot) {
        var h = [];
        for (var out in w.outputs) { h.push(w.outputs[out]); }
        // remove spent
        var utxo = h.filter(function(x) { return !x.spend; });

        // remove unconfirmed (leave hot change if 'hot' is true)
        utxo = utxo.filter(function(x) { return (x.height || (hot&&x.change)); });

        // organize and select
        var valuecompare = function(a,b) { return a.value > b.value; };
        var high = utxo.filter(function(o) { return o.value >= value; })
                       .sort(valuecompare);
        if (high.length > 0) { return [high[0]]; }
        utxo.sort(valuecompare);
        var totalval = 0;
        for (var i = 0; i < utxo.length; i++) {
            totalval += utxo[i].value;
            if (totalval >= value) { return utxo.slice(0,i+1); }
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
 * Mark an output as spent
 */
Wallet.prototype.markOutput = function(output, index) {
    output.spend = index;
    output.spendpending = true;
    output.spendheight = 0;
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
        output = { receive: outId,
                   value: value,
                   counted: false,
                   address: walletAddress.address };
        wallet.outputs[outId] = output;
        walletAddress.nOutputs += 1;
    }
    // Set as change
    if (!height && output.change === undefined) {
        // no 0 confirm spends for now
        // output.change = this.identity.tx.inputsMine(txHash, tx);
    }
    // If confirmed or inputs are mine and not spent add balance
    if ((output.change || height) && !output.height && !spend) {
        // Add if we didn't add it yet
        if (!output.counted) {
            walletAddress.balance += value;
            output.counted = true;
        }
    }
    if (walletAddress.type === 'stealth') {
        output.stealth = true;
    }
    // Save height
    if (!output.height) {
        output.height = height;
    }

    // If it's a spend save the next output and spend height
    if (spend && !output.spend) {
        output.spend = spend;
        output.spendheight = spendheight;
        output.spendpending = true;
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
    walletAddress.history = history;

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
            spend = inTxHash + ":" + tx[5];
        }
        // pass on to internal Bitcoin.Wallet
        self.processOutput(walletAddress, outTxHash, tx[1], tx[3], outHeight, spend, tx[6]);
    });
    if (!initial) {
        this.store.save();
    }
};

/**
 * Get the stealth scanning ECKey
 * @param {Number} n key index
 * @return {Object} The scanning key
 */
Wallet.prototype.getScanKey = function(n) {
    var scanMaster = this.scanKeys[0];
    var scanMasterKey = Bitcoin.HDWallet.fromBase58(scanMaster.priv);
    var childKey = scanMasterKey.derive(n);
    return childKey.priv;
};

/**
 * Get the identity ECKey
 * @param {Number} n key index
 * @return {Object} The scanning key
 */
Wallet.prototype.getIdentityKey = function(n) {
    n = n || 0;
    var idMaster = this.idKeys[0];
    var idMasterKey = Bitcoin.HDWallet.fromBase58(idMaster.priv);
    var childKey = idMasterKey.derive(n);
    return childKey.priv;
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
    var branchId = pocketIndex*2;
    var seq = [branchId, 's'].concat(ephemKey);
    var walletAddress = this.pubKeys[seq];
    // Check for bad addresses and put them in the right pocket if found. (0.2.0)
    if (!walletAddress && branchId > 0) {
        var badIndex = [0, 's'].concat(ephemKey);
        var badAddress = this.pubKeys[badIndex];
        if (badAddress) {
            // The address was originally placed in the wrong pocket. need to relink it.
            delete this.pubKeys[badIndex];
            badAddress.index = seq.slice(0);
            this.pubKeys[seq] = badAddress;
            walletAddress = badAddress;
        }
    }
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

return Wallet;
});
