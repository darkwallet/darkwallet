/*
 * @fileOverview Stealth support.
 */
'use strict';

define(['bitcoinjs-lib', 'convert', 'bigi', 'bs58check', 'buffer'], function(Bitcoin, Convert, BigInteger, base58check, Buffer) {

var bufToArray = function(obj) {return Array.prototype.slice.call(obj, 0);};

var Stealth = {};
 
// Versions for address format
Stealth.version = 42;
Stealth.testnet = 43;

// Can these be different in the future?
Stealth.nonceVersion = 6;

// Backwards compatibility quirk (0.4.0)
Stealth.quirk = false;

/*
 * Create a bitcoin key with just public component.
 * @param {Object} Q public key as bytes
 * @private
 */
Stealth.importPublic = function(Q) {
    var key = Bitcoin.ECPubKey.fromBytes(Q, true);
    return key;
};

/*
 * Perform curvedh and stealth formatting
 * @param {Bitcoin.BigInteger} e private part
 * @param {Bitcoin.ECKey} decKey public key
 * @private
 */
Stealth.stealthDH = function(e, decKey) {
    // diffie hellman stage
    var point = decKey.Q.multiply(e);

    // start the second stage
    var S1;
    if (Stealth.quirk) {
        S1 = new Buffer([3].concat(point.affineX.toBuffer().toJSON().data));
    } else {
        S1 = point.getEncoded(true);
    }
    var c = Bitcoin.crypto.sha256(S1);
    return BigInteger.fromBuffer(c);
};


/*
 * Format a stealth address in base58
 * @param {Object} scanPubKeyBytes Public key as byte array
 * @param {Object} spendPubKeys Spend public keys as array of byte arrays
 * @param {Number} version Version to use packing the nonce
 *
 * [version:1] [options:1] [scan_pubkey:33] [N:1] [spend_pubkey_1:33] ...
[spend_pubkey_N:33] [number_sigs:1] [prefix_length:1] [prefix:prefix_length/8, round up]
 * version = 255
 * options bitfield = 0 or 1 (reuse scan_pubkey for spends)
 */
Stealth.formatAddress = function(scanPubKeyBytes, spendPubKeys, version) {
    if (version === undefined || version === null) {
        version = Stealth.version;
    }
    if (!spendPubKeys) {
        spendPubKeys = [];
    }
    var reuseScan = spendPubKeys.length ? 0 : 1;

    // Header, version will be added later when encoding
    var stealth = [reuseScan];

    // Add scan public key
    stealth = stealth.concat(scanPubKeyBytes);

    // Add spend public keys
    stealth = stealth.concat([spendPubKeys.length]);
    spendPubKeys.forEach(function(spendPubKey) {
        stealth = stealth.concat(spendPubKey);
    });

    // Number of signatures
    var nSigs = spendPubKeys.length || 1;
    stealth = stealth.concat([nSigs]);

    // TODO: Add prefix
    stealth = stealth.concat([0]);
    // Encode in base58 and add version
    stealth = [version].concat(stealth);
    return base58check.encode(new Buffer(stealth));
};

/*
 * Parse a stealth address into its forming parts
 * @param {String} recipient Address in base58 format
 */
Stealth.parseAddress = function(recipient) {
    // TODO perform consistency checks here
    var stealthBytes = bufToArray(base58check.decode(recipient).slice(1));
    var options = stealthBytes.splice(0, 1)[0];
    var scanKeyBytes = stealthBytes.splice(0, 33);
    var nSpendKeys = stealthBytes.splice(0, 1)[0];

    var spendKeys = [];
    for(var idx=0; idx<nSpendKeys; idx++) {
        spendKeys.push(stealthBytes.splice(0, 33));
    }
    var nSigs = stealthBytes.splice(0, 1)[0];

    // Prefix should be the remaining bytes
    var prefix = stealthBytes.splice(0);

    // Return packed in an object
    return {options: {reuseScan: options},
            scanKey: scanKeyBytes,
            spendKeys: spendKeys,
            sigs: nSigs,
            prefix: prefix};
};


/*
 * Generate a key and related address to send to for a stealth address
 * @param {Object} scanKeyBytes Scanning key as byte array
 * @param {Object} spendKeyBytes Spending key as byte array
 * @param {Number} version Version to use packing the addresses
 * @param {Object} ephemKeyBytes (optional) Ephemeral private key as byte array,
 *                                if null will be generated.
 */
Stealth.initiateStealth = function(scanKeyBytes, spendKeyBytes, version, ephemKeyBytes) {
    if (version === null || version === undefined) { version = Bitcoin.networks.bitcoin.pubKeyHash; };
    // Parse public keys into api objects
    var scanKey = Stealth.importPublic(scanKeyBytes);
    var spendKey = Stealth.importPublic(spendKeyBytes);

    // new ephemeral key
    var encKey = Bitcoin.ECKey.fromBytes(ephemKeyBytes);
    var ephemKey = bufToArray(encKey.pub.Q.getEncoded(true));
    // For new stealth we will later remove the first byte of the ephem

    // Generate shared secret
    var c = Stealth.stealthDH(encKey.d, scanKey);

    // Now generate pubkey and address
    var pubKeyBuf = Stealth.derivePublicKey(spendKey, c);

    var mpKeyHash = Bitcoin.crypto.hash160(pubKeyBuf);
    var address = new Bitcoin.Address(mpKeyHash, version);
    return [address, ephemKey, bufToArray(pubKeyBuf)];
};

/*
 * Generate shared secret given the scan secret and an ephemeral key
 * @param {Object} scanSecretBytes Secret as byte array
 * @param {Object} ephemKeyBytes Ephemeral key data as byte array
 * @param {Object} spendKeyBytes Spend key as bytes
 * @private
 */
Stealth.uncoverStealth = function(scanSecret, ephemKeyBytes) {
    // Parse public keys into api objects
    var decKey = Stealth.importPublic(ephemKeyBytes);

    // Parse the secret into a BigInteger
    var priv = BigInteger.fromByteArrayUnsigned(scanSecret.slice(0, 32));

    // Generate shared secret
    return Stealth.stealthDH(priv, decKey);
};

/*
 * Generate a public key bytes for a stealth transaction 
 * @param {Object} scanSecretBytes User's scan secret as byte array
 * @param {Object} ephemKeyBytes Tx ephemeral key data as byte array
 * @param {Object} spendKeyBytes User's public spend key as bytes
 * @returns byte array representing the public key
 */
Stealth.uncoverPublic = function(scanSecret, ephemKeyBytes, spendKeyBytes) {
    // Now generate address
    var spendKey = Stealth.importPublic(spendKeyBytes);

    var c = Stealth.uncoverStealth(scanSecret, ephemKeyBytes);

    return Stealth.derivePublicKey(spendKey, c);
};

/*
 * Generate a public key bytes for a stealth transaction 
 * @param {Object} scanSecretBytes User's scan secret as byte array
 * @param {Object} ephemKeyBytes Tx ephemeral key data as byte array
 * @param {Object} spendKeyBytes User's private spend key as bytes
 */
Stealth.uncoverPrivate = function(scanSecret, ephemKeyBytes, spendKeyBytes) {
    var c = Stealth.uncoverStealth(scanSecret, ephemKeyBytes);

    // Now generate address
    var spendKey = Bitcoin.ECKey.fromBytes(spendKeyBytes, true);
    return Stealth.derivePrivateKey(spendKey, c);
};


/*
 * Derive a private key from spend key and shared secret
 * @param {Bitcoin.ECKey} spendKey Spend Private Key
 * @param {BigInteger} c Derivation value
 * @returns {Bitcoin.ECKey}
 * @private
 */
Stealth.derivePrivateKey = function(spendKey, c) {
    // Generate the key with the bitcoin api
    return new Bitcoin.ECKey(spendKey.d.add(c).mod(Bitcoin.ECKey.curve.n), spendKey.pub.compressed);
};

/*
 * Derive public key from spendKey and shared secret
 * @param {Bitcoin.ECPubKey} spendKey Spend Key
 * @param {BigInteger} c Derivation value
 * @returns {Bitcoin.ECKey} Derived (compressed) public key bytes
 * @private
 */
Stealth.derivePublicKey = function(spendKey, c) {
    // Now generate address
    var bytes = spendKey.Q
                          .add(new Bitcoin.ECKey(c).pub.Q)
                          .getEncoded(true);

    return bytes;
};


/*
 * Derive a Bitcoin Address from spendKey and shared secret
 * @param {Bitcoin.ECPubKey} spendKey Spend Key
 * @param {BigInteger} c Derivation value
 * @param {Number} version Version to use packing the address
 * @returns {Bitcoin.Address} Derived bitcoin address
 * @private
 */
Stealth.deriveAddress = function(spendKey, c, version) {
    if (version === null || version === undefined) { version = Bitcoin.networks.bitcoin.pubKeyHash; };
    // Now generate address
    var pubKeyBuf = this.derivePublicKey(spendKey, c);

    // Turn to address
    var mpKeyHash = Bitcoin.crypto.hash160(pubKeyBuf);
    var address = new Bitcoin.Address(mpKeyHash, version);
    return address;
};

/*
 * Build the stealth nonce output so it can be added to a transaction.
 * returns a Bitcoin.TransactionOut object.
 * @param {Object} ephemKeyBytes Ephemeral key data as byte array
 * @param {Number} nonce Nonce for the output
 * @param {Number} version Version to use packing the nonce
 * @returns {Bitcoin.TransactionOut} stealth transaction output
 * @private
 */
Stealth.buildNonceOldScript = function(ephemKeyBytes, nonce, version) {
    if (version === null || version === undefined) { version = Stealth.nonceVersion; };

    // Initialize chunks with op_return
    var chunks = [Bitcoin.opcodes.OP_RETURN];

    // Add the nonce chunk
    var nonceBytes = Convert.numToBytes(nonce, 4);
    var ephemScript = [version];
    ephemScript = ephemScript.concat(nonceBytes.concat(ephemKeyBytes));
    chunks.push(new Buffer(ephemScript));    

    return Bitcoin.Script.fromChunks(chunks);
};

Stealth.buildNonceNewScript = function(ephemKeyBytes, nonce) {
    // Initialize chunks with op_return
    var chunks = [Bitcoin.opcodes.OP_RETURN];

    // Add the ephemkey chunk
    var nonceBytes = Convert.numToBytes(nonce, 4);

    var ephemScript = ephemKeyBytes.concat(nonceBytes);
    chunks.push(new Buffer(ephemScript));

    return Bitcoin.Script.fromChunks(chunks);
};

Stealth.buildNonceScript = function(ephemKeyBytes, nonce, version) {
    if (version) {
        return this.buildNonceOldScript(ephemKeyBytes, nonce, version);
    } else {
        return this.buildNonceNewScript(ephemKeyBytes, nonce, version);
    }
};

/*
 * Check prefix against the given array
 * returns true or false
 * @param {Object} outHash byte array to compare to
 * @param {Number} prefix prefix array including first byte defining mask
 * @returns {Boolean} whether the prefix matches
 * @private
 */
Stealth.checkPrefix = function(outHash, stealthPrefix) {
    var prefixN = stealthPrefix[0];
    var prefix = stealthPrefix.slice(1);
    var mask = 1<<7;
    var nbyte = 0;
    while(prefixN) {
        // check current bit
        if ((outHash[nbyte] & mask) != (prefix[nbyte] & mask)) {
            return false;
        }
        if (mask === 1) {
            // restart mask and advance byte
            mask = 1<<7;
            nbyte += 1;
        } else {
            // advance mask one bit to the right
            mask = (mask >> 1);
        }
        prefixN -= 1;
    }
    return true;
};

/*
 * Add stealth output to the given transaction and return destination address.
 * returns the new recipient (standard bitcoin address)
 * @param {String} recipient Stealth address in base58 format.
 * @param {Number} addressVersion Version to use packing the addresses
 * @param {Number} nonceVersion Version to use packing the nonce
 * @param {Bitcoin.Transaction} newTx Transaction where we want to add stealth outputs.
 * @param {Object} ephemKeyBytes (optional) Ephemeral private key as byte array,
 *                                if null will be generated.
 */

Stealth.addStealth = function(recipient, newTx, addressVersion, nonceVersion, ephemKeyBytes, initialNonce) {
    if (nonceVersion === undefined) { nonceVersion = Stealth.nonceVersion; };
    if (addressVersion === undefined) { addressVersion = Bitcoin.networks.bitcoin.pubKeyHash; };
    var outHash, ephemKey, pubKey, ephemKeyRaw;
    var stealthAddress = Stealth.parseAddress(recipient);
    var stealthPrefix = stealthAddress.prefix;
    var scanKeyBytes = stealthAddress.scanKey;

    // start checking nonce in a random position so we don't leak information
    var maxNonce = Math.pow(2, 32);
    var startingNonce = initialNonce || Math.floor(Math.random()*maxNonce);

    // iterate since we might not find a nonce for our required prefix then
    // we need to create a new ephemkey
    // TODO: Correctly manage spend keys here when there is more than one
    var spendKeyBytes = stealthAddress.spendKeys[0];
    var nonce;
    do {
        var stealthData = Stealth.initiateStealth(scanKeyBytes, spendKeyBytes, addressVersion, ephemKeyBytes);
        recipient = stealthData[0];
        ephemKeyRaw = stealthData[1];
        ephemKey = ephemKeyRaw.slice(0);
        if (!nonceVersion) {
            ephemKey.splice(0, 1);
        }
        pubKey = stealthData[2];
        nonce = startingNonce;
        var iters = 0;
        // iterate through nonces to find a match for given prefix
        do {
            // modify the nonce first so it's unchanged after exiting the loop
            nonce += 1;
            iters += 1;
            if (nonce > maxNonce) {
                nonce = 0;
            }
            var nonceBytes = Convert.numToBytes(nonce, 4);

            // Hash the nonce 
            outHash = bufToArray(Bitcoin.crypto.hash160(new Buffer(nonceBytes.concat(ephemKey))));
        } while(iters < maxNonce && !Stealth.checkPrefix(outHash, stealthPrefix));

    } while(!Stealth.checkPrefix(outHash, stealthPrefix));

    // we finally mined the ephemKey that makes the hash match
    var stealthOut = Stealth.buildNonceScript(ephemKey, nonce-1, nonceVersion);
    newTx.addOutput(stealthOut, 0);
    return {address: recipient, ephemKey: ephemKeyRaw, pubKey: pubKey};
};

return Stealth;
});
