/*
 * @fileOverview Stealth support.
 */

define(['bitcoinjs-lib'], function(Bitcoin) {

var convert = Bitcoin.convert;

var Stealth = {};
 
// Version for address format
Stealth.version = 255;

// Can these be different in the future?
Stealth.nonceVersion = Stealth.version;

/*
 * Create a bitcoin key with just public component.
 * @param {Object} Q public key as bytes
 * @private
 */
Stealth.importPublic = function(Q) {
    var key = new Bitcoin.ECPubKey(Q, true);
    return key;
}

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
    var S1 = [3].concat(point.getX().toBigInteger().toByteArrayUnsigned());
    var c = convert.wordArrayToBytes(Bitcoin.Crypto.SHA256(convert.bytesToWordArray(S1)));
    return c;
}


/*
 * Format a stealth address in base58
 * @param {Object} scanPubKeyBytes Public key as byte array
 * @param {Object} spendPubKeys Spend public keys as array of byte arrays
 *
 * [version:1] [options:1] [scan_pubkey:33] [N:1] [spend_pubkey_1:33] ...
[spend_pubkey_N:33] [number_sigs:1] [prefix_length:1] [prefix:prefix_length/8, round up]
 * version = 255
 * options bitfield = 0 or 1 (reuse scan_pubkey for spends)
 */
Stealth.formatAddress = function(scanPubKeyBytes, spendPubKeys) {
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
    return Bitcoin.base58.checkEncode(stealth, Stealth.version);
}

/*
 * Parse a stealth address into its forming parts
 * @param {String} recipient Address in base58 format
 */
Stealth.parseAddress = function(recipient) {
    // TODO perform consistency checks here
    var stealthBytes = Bitcoin.base58.checkDecode(recipient);
    var options = stealthBytes.splice(0, 1)[0];
    var scanKeyBytes = stealthBytes.splice(0, 33);
    var nSpendKeys = stealthBytes.splice(0, 1)[0];
    var spendKeys = [];
    for(var idx=0; idx<nSpendKeys; idx++) {
        spendKeys.push(stealthBytes.splice(0, 33));
    }
    var nSigs = stealthBytes.splice(0, 1)[0];

    // Prefix should be the remaining bytes
    var prefix = stealthBytes.slice(0);

    // Return packed in an object
    return {options: {reuseScan: options},
            scanKey: scanKeyBytes,
            spendKeys: spendKeys,
            sigs: nSigs,
            prefix: prefix};
}


/*
 * Generate a key and related address to send to for a stealth address
 * @param {Object} scanKeyBytes Scanning key as byte array
 * @param {Object} spendKeyBytes Spending key as byte array
 * @param {Object} ephemKeyBytes (optional) Ephemeral private key as byte array,
 *                                if null will be generated.
 */
Stealth.initiateStealth = function(scanKeyBytes, spendKeyBytes, ephemKeyBytes) {
    // Parse public keys into api objects
    var scanKey = Stealth.importPublic(scanKeyBytes);
    var spendKey = Stealth.importPublic(spendKeyBytes);

    // new ephemeral key
    var encKey = new Bitcoin.ECKey(ephemKeyBytes);
    var ephemKey = encKey.getPub().pub.getEncoded(true);

    // Generate shared secret
    var c = Stealth.stealthDH(encKey.priv, scanKey)

    // Now generate address
    var address = Stealth.deriveAddress(spendKey, c);
    return [address, ephemKey]
}

/*
 * Generate address for receiving for a spend key with the given ephemkey
 * @param {Object} scanSecretBytes Secret as byte array
 * @param {Object} ephemKeyBytes Ephemeral key data as byte array
 * @param {Object} spendKeyBytes Spend key as bytes
 */
Stealth.uncoverStealth = function(scanSecret, ephemKeyBytes, spendKeyBytes) {
    // Parse public keys into api objects
    var decKey = Stealth.importPublic(ephemKeyBytes);
    var spendKey = Stealth.importPublic(spendKeyBytes);

    // Parse the secret into a BigInteger
    var priv = Bitcoin.BigInteger.fromByteArrayUnsigned(scanSecret.slice(0, 32));

    // Generate shared secret
    var c = Stealth.stealthDH(priv, decKey)

    // Now generate address
    return Stealth.deriveKey(spendKey, c);
}

/*
 * Derive a private key from spend key and shared secret
 * @param {Bitcoin.ECKey} spendKey Spend Key
 * @param {BigInteger} c Derivation value
 */
Stealth.derivePrivateKey = function(spendKey, c) {
    // Generate the key with the bitcoin api
    return spendKey.add(c);
}

/*
 * Derive public key from spendKey and shared secret
 * @param {Bitcoin.ECPubKey} spendKey Spend Key
 * @param {BigInteger} c Derivation value
 */
Stealth.deriveKey = function(spendKey, c) {
    // Now generate address
    var bytes = spendKey.pub
                          .add(new Bitcoin.ECKey(c).getPub().pub)
                          .getEncoded(true);

    return bytes;
}


/*
 * Derive a Bitcoin Address from spendKey and shared secret
 * @param {Bitcoin.ECPubKey} spendKey Spend Key
 * @param {BigInteger} c Derivation value
 */
Stealth.deriveAddress = function(spendKey, c) {
    // Now generate address
    var bytes = this.deriveKey(spendKey, c);

    // Turn to address
    var mpKeyHash = Bitcoin.Util.sha256ripe160(bytes);
    var address = new Bitcoin.Address(mpKeyHash);
    return address;
}

/*
 * Build the stealth nonce output so it can be added to a transaction.
 * returns a Bitcoin.TransactionOut object.
 * @param {Object} ephemKeyBytes Ephemeral key data as byte array
 * @param {Number} nonce Nonce for the output
 */
Stealth.buildNonceOutput = function(ephemKeyBytes, nonce) {
    var ephemScript = new Bitcoin.Script();
    ephemScript.writeOp(Bitcoin.Opcode.map.OP_RETURN);
    var nonceBytes = convert.numToBytes(nonce, 4);
    ephemScript.writeBytes([Stealth.nonceVersion].concat(nonceBytes.concat(ephemKeyBytes)));
    var stealthOut = new Bitcoin.TransactionOut({script: ephemScript, value: 0});
    return stealthOut;
}

/*
 * Check prefix against the given array
 * returns true or false
 * @param {Object} outHash byte array to compare to
 * @param {Number} prefix prefix array including first byte defining mask
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
        if (mask == 1) {
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
}

/*
 * Add stealth output to the given transaction and return destination address.
 * returns the new recipient (standard bitcoin address)
 * @param {String} recipient Stealth address in base58 format.
 * @param {Bitcoin.Transaction} newTx Transaction where we want to add stealth outputs.
 * @param {Object} ephemKeyBytes (optional) Ephemeral private key as byte array,
 *                                if null will be generated.
 */

Stealth.addStealth = function(recipient, newTx, ephemKeyBytes) {
    var stealthData, outHash, ephemKey, nonce;
    var stealthAddress = Stealth.parseAddress(recipient);
    var stealthPrefix = stealthAddress.prefix;
    // iterate since we might not find a nonce for our required prefix then
    // we need to create a new ephemkey
    var scanKeyBytes = stealthAddress.scanKey;

    // TODO: Correctly manage spend keys here
    var spendKeyBytes = stealthAddress.spendKeys[0];
    do {
        stealthData = Stealth.initiateStealth(scanKeyBytes, spendKeyBytes, ephemKeyBytes);
        recipient = stealthData[0].toString();
        ephemKey = stealthData[1];
        nonce = 0;
        // iterate through nonces to find a match for given prefix
        do {
	    var nonceBytes = convert.numToBytes(nonce, 4)
            outHash = Bitcoin.Util.sha256ripe160(nonceBytes.concat(ephemKey));
            nonce += 1;
        } while(nonce < 4294967296 && !Stealth.checkPrefix(outHash, stealthPrefix));

    } while(!Stealth.checkPrefix(outHash, stealthPrefix));

    // we finally mined the ephemKey that makes the hash match
    var stealthOut = Stealth.buildNonceOutput(ephemKey, nonce);
    newTx.addOutput(stealthOut);
    return recipient;
}

return Stealth;
});
