/*
 * @fileOverview Stealth support.
 */

define(['darkwallet','bitcoinjs-lib', 'sjcl'], function(DarkWallet, Bitcoin, sjcl) {

var convert = Bitcoin.convert;

var Stealth = {};
 
// Elliptic curve N (couldn't find a way to get it from bitcoin api, so just hardcoded it here...)
Stealth.ecN = new Bitcoin.BigInteger("115792089237316195423570985008687907852837564279074904382605163141518161494337");

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
    var key = new Bitcoin.ECPubKey(Q);
    return key;
}

/*
 * Perform curvedh and stealth formatting
 * @param {Bitcoin.BigInteger} e private part
 * @param {Bitcoin.Key} decKey public key
 * @private
 */
Stealth.stealthDH = function(e, decKey) {
    // diffie hellman stage
    var point = decKey.getPubPoint().multiply(e);

    // start the second stage
    var S1 = [3].concat(point.getX().toBigInteger().toByteArrayUnsigned());
    var c = convert.wordArrayToBytes(Bitcoin.Crypto.SHA256(convert.bytesToWordArray(S1)));
    return c;
}


/*
 * Get the stealth address for a public key
 * @param {Object} mpPubKey Public key as byte array
 *
 * [version:1] [options:1] [scan_pubkey:33] [N:1] [spend_pubkey_1:33] ...
[spend_pubkey_N:33] [number_sigs:1] [prefix_length:1] [prefix:prefix_length/8, round up]
 * version = 255
 * options bitfield = 0 or 1 (reuse scan_pubkey for spends)
 */
Stealth.formatAddress = function(scanPubKey, spendPubKeys) {
    if (!spendPubKeys) {
        spendPubKeys = [];
    }
    var reuseScan = spendPubKeys.length ? 0 : 1;

    // Header, version will be added later when encoding
    var stealth = [reuseScan];

    // Add scan public key
    stealth = stealth.concat(scanPubKey);

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

Stealth.parseAddress = function(recipient) {
    // TODO perform consistency checks here
    var stealthBytes = Bitcoin.base58.checkDecode(recipient);
    var options = stealthBytes.splice(0, 1);
    var scanKeyBytes = stealthBytes.splice(0, 33);
    var nSpendKeys = stealthBytes.splice(0, 1);
    var spendKeys = [];
    for(var idx; idx<nSpendKeys; idx++) {
        spendKeys.push(stealthBytes.splice(0, 33));
    }
    var nSigs = stealthBytes.splice(0, 1);

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
 */
Stealth.initiateStealth = function(scanKeyBytes, spendKeyBytes) {
    // Parse public keys into api objects
    var scanKey = Stealth.importPublic(scanKeyBytes);
    var spendKey = Stealth.importPublic(spendKeyBytes);

    // new ephemeral key
    var encKey = new Bitcoin.Key();
    var ephemKey = encKey.getPubPoint().getEncoded(true);

    // Generate shared secret
    var c = Stealth.stealthDH(encKey.priv, scanKey)

    // Now generate address
    var address = Stealth.deriveAddress(spendKey, c);
    return [address, ephemKey]
}

/*
 * Generate key for receiving for a stealth address with a given ephemkey
 * @param {Object} masterSecret Secret as byte array
 * @param {Object} ephemKey Ephemeral key data as byte array
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
    var address = Stealth.deriveAddress(spendKey, c);
    return address;
}

Stealth.deriveAddress = function(spendKey, c) {
    // Now generate address
    var bytes = spendKey.getPubPoint()
                          .add(new Bitcoin.Key(c).getPubPoint())
                          .getEncoded(true);

    // Turn to address
    var mpKeyHash = Bitcoin.Util.sha256ripe160(bytes);
    var address = new Bitcoin.Address(mpKeyHash);
    return address;
}

/*
 * Build the stealth nonce output so it can be added to a transaction.
 * returns a Bitcoin.TransactionOut object.
 * @param {Object} ephemKey Ephemeral key data as byte array
 * @param {Number} nonce Nonce for the output
 */
Stealth.buildNonceOutput = function(ephemKey, nonce) {
    var ephemScript = new Bitcoin.Script();
    ephemScript.writeOp(Bitcoin.Opcode.map.OP_RETURN);
    var nonceBytes = Bitcoin.Util.numToBytes(nonce, 4);
    ephemScript.writeBytes([Stealth.nonceVersion].concat(nonceBytes.concat(ephemKey)));
    var stealthOut = new Bitcoin.TransactionOut({script: ephemScript, value: 0});
    return stealthOut;
}

/*
 * Generate bit mask for a given prefix
 * returns true or false
 * @param {Object} outHash byte array to compare to
 * @param {Number} prefix prefix array including first byte defining maskq
 */
Stealth.prefixBitMask = function(prefixN) {
    var mask = 0;
    var remainder = 32 - prefixN
    while(prefixN) {
        mask = (mask<<1) + 1;
        prefixN--;
    }
    while (remainder) {
        mask = (mask<<1);
        remainder--;
    }
    return mask;
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
    if (prefixN) {
        var mask = Stealth.prefixBitMask(prefixN);
        var prefixNum = Bitcoin.Util.bytesToNum(prefix);
        var hashNum = Bitcoin.Util.bytesToNum(outHash.slice(0,4));
        if ((mask & prefixNum) == hashNum) {
            return true;
        } else {
            return false;
        }
    }
    return true;
}

/*
 * Add stealth output to the given transaction and return destination address.
 * returns the new recipient (standard bitcoin address)
 * @param {String} recipient Stealth address in base58 format.
 * @param {Bitcoin.Transaction} newTx Transaction where we want to add stealth outputs.
 */

Stealth.addStealth = function(recipient, newTx) {
    var stealthData, outHash, ephemKey, nonce;
    var stealthAddress = Stealth.parseStealthAddress(recipient);
    var stealthPrefix = stealthAddress.prefix;
    // iterate since we might not find a nonce for our required prefix then
    // we need to create a new ephemkey
    var scanKeyBytes = stealthAddress.scanKey;
    var spendKeyBytes = stealthAddress.spendKeys[0];
    do {
        stealthData = Stealth.initiateStealth(scanKeyBytes, spendKeyBytes);
        recipient = stealthData[0].toString();
        ephemKey = stealthData[1];
        nonce = 0;
        // iterate through nonces to find a match for given prefix
        do {
	    var nonceBytes = Bitcoin.Util.numToBytes(nonce, 4)
            outHash = Bitcoin.Util.sha256ripe160(nonceBytes.concat(ephemKey));
            nonce += 1;
        } while(nonce < 4294967296 && !Stealth.checkPrefix(outHash, stealthPrefix));

    } while(!Stealth.checkPrefix(outHash, stealthPrefix));

    // we finally mined the ephemKey that makes the hash match
    var stealthOut = Stealth.buildNonceOutput(ephemKey, nonce);
    newTx.addOutput(stealthOut);
    return recipient;
}

/*************************************
 * EXPERIMENTAL... don't read below! :-D
 * Test encrypt / decrypt using similar derivation as stealth
 */

/*
 * Decrypt the given message for some identity bip32 key
 * @param {String} message Message to decrypt
 * @param {DarkWallet.Identity} identity Identity to use
 * @param {Array} seq Key seq to use for decryption
 * @param {String} password Password for the user private keys
 * @param {Object} callback Callback receiving the decrypted data
 */

Stealth.decryptForIdentity = function(message, identity, seq, password, callback) {
    identity.wallet.getPrivateKey(seq, password, function(privKey) {
        callback(Stealth.decrypt(privKey, message));
    });
}

/*
 * Encrypt the given message
 * @param {Object} pubKey Public key as byte array
 * @param {String} Message to encrypt
 */
Stealth.encrypt = function(pubKey, message) {
    var encKey = new Bitcoin.Key();
    var ephemKey = encKey.getPubPoint().getEncoded(true);

    var decKey = Stealth.importPublic(pubKey);
    var c = Stealth.stealthDH(encKey.priv, decKey);
    var _pass = Bitcoin.convert.bytesToString(c);
    var encrypted = sjcl.encrypt(_pass, message, {ks: 256, ts: 128});
    return {pub: ephemKey, data: sjcl.json.decode(encrypted)}
}

/*
 * Decrypt the given message
 * @param {Bitcoin.Key} pubKey Private key
 * @param {String} message Message to decrypt, should have pub and data components
 */
Stealth.decrypt = function(privKey, message) {
    var masterSecret = privKey.export('bytes')
    var priv = Bitcoin.BigInteger.fromByteArrayUnsigned(masterSecret.slice(0, 32));

    var decKey = Stealth.importPublic(message.pub);
    var c = Stealth.stealthDH(priv, decKey)
    var _pass = Bitcoin.convert.bytesToString(c);
    var decrypted = sjcl.decrypt(_pass, sjcl.json.encode(message.data));

    return decrypted;
}


/*************************************
 * Some tests...
 */
Stealth.testFinishStealth = function(secret, ephemKey) {
    ephemKey = Bitcoin.convert.hexToBytes(ephemKey)
    secret = Bitcoin.convert.hexToBytes(secret)
    console.log(Stealth.uncoverStealth(secret, ephemKey));
}

Stealth.testStealth = function(identity, password, address) {
    var bytes = Bitcoin.base58.checkDecode(address);
    var res1 = Stealth.initiateStealth(bytes.slice(0,33));
    var address = res1[0];
    console.log(address.toString(), bytes, bytes.slice(0,33))
    var ephemkey = res1[1];
    DarkWallet.getKeyRing().identities[identity].wallet.getPrivateKey([0], password, function(privKey) {
        Stealth.uncoverStealth(privKey.key.export('bytes').slice(0,32), ephemkey);
    });
}
return Stealth;
});
