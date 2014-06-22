/*
 * @fileOverview Stealth support.
 */
'use strict';

define(['bitcoinjs-lib'], function(Bitcoin) {

var bufToArray = function(obj) {return Array.prototype.slice.call(obj, 0);};

var convert = Bitcoin.convert;

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
    var key = new Bitcoin.ECPubKey(Q, true);
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
    var point = decKey.pub.multiply(e);

    // start the second stage
    var S1;
    if (Stealth.quirk) {
        S1 = [3].concat(point.getX().toBigInteger().toByteArrayUnsigned());
    } else {
        S1 = point.getEncoded(true);
    }
    var c = convert.wordArrayToBytes(Bitcoin.CryptoJS.SHA256(convert.bytesToWordArray(S1)));
    return c;
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
    return Bitcoin.base58check.encode(stealth, version);
};

/*
 * Parse a stealth address into its forming parts
 * @param {String} recipient Address in base58 format
 */
Stealth.parseAddress = function(recipient) {
    // TODO perform consistency checks here
    var stealthBytes = bufToArray(Bitcoin.base58check.decode(recipient).payload);
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
    if (version === null || version === undefined) { version = Bitcoin.network.mainnet.addressVersion; };
    // Parse public keys into api objects
    var scanKey = Stealth.importPublic(scanKeyBytes);
    var spendKey = Stealth.importPublic(spendKeyBytes);

    // new ephemeral key
    var encKey = new Bitcoin.ECKey(ephemKeyBytes);
    var ephemKey = encKey.getPub().pub.getEncoded(true);

    // Generate shared secret
    var c = Stealth.stealthDH(encKey.priv, scanKey);

    // Now generate pubkey and address
    var pubKey = Stealth.deriveKey(spendKey, c);

    var mpKeyHash = Bitcoin.crypto.hash160(pubKey);
    var address = new Bitcoin.Address(mpKeyHash, version);
    return [address, ephemKey, pubKey];
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
    var priv = Bitcoin.BigInteger.fromByteArrayUnsigned(scanSecret.slice(0, 32));

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
    var spendKey = new Bitcoin.ECKey(spendKeyBytes, true);
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
    return spendKey.add(c);
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
    var bytes = spendKey.pub
                          .add(new Bitcoin.ECKey(c).getPub().pub)
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
    if (version === null || version === undefined) { version = Bitcoin.network.mainnet.addressVersion; };
    // Now generate address
    var bytes = this.derivePublicKey(spendKey, c);

    // Turn to address
    var mpKeyHash = Bitcoin.crypto.hash160(bytes);
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
Stealth.buildNonceOutput = function(ephemKeyBytes, nonce, version) {
    if (version === null || version === undefined) { version = Stealth.nonceVersion; };

    var ephemScript = new Bitcoin.Script();
    ephemScript.writeOp(Bitcoin.Opcode.map.OP_RETURN);
    var nonceBytes = convert.numToBytes(nonce, 4);
    ephemScript.writeBytes([version].concat(nonceBytes.concat(ephemKeyBytes)));
    var stealthOut = new Bitcoin.TransactionOut({script: ephemScript, value: 0});
    return stealthOut;
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
    if (addressVersion === undefined) { addressVersion = Bitcoin.network.mainnet.addressVersion; };
    var outHash, ephemKey, pubKey;
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
        ephemKey = stealthData[1];
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
            var nonceBytes = convert.numToBytes(nonce, 4);

            // Hash the nonce 
            outHash = bufToArray(Bitcoin.crypto.hash160(nonceBytes.concat(ephemKey)));
        } while(iters < maxNonce && !Stealth.checkPrefix(outHash, stealthPrefix));

    } while(!Stealth.checkPrefix(outHash, stealthPrefix));

    // we finally mined the ephemKey that makes the hash match
    var stealthOut = Stealth.buildNonceOutput(ephemKey, nonce-1, nonceVersion);
    newTx.addOutput(stealthOut);
    return {address: recipient, ephemKey: ephemKey, pubKey: pubKey};
};

return Stealth;
});
