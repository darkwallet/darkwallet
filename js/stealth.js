/*
 * @fileOverview Stealth support.
 */

Stealth = {};

/*
 * Create a bitcoin key with just public component.
 * @param {Object} Q public key
 * @private
 */
Stealth.importPublic = function(Q) {
    //console.log('Q', Bitcoin.convert.bytesToHex(Q));
    var key = new Bitcoin.Key();
    delete key.priv;
    key.setPub(Q);
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
    //console.log('pub point', decKey.getPubPoint().toString());
    //console.log('diffie point', point.toString());

    // start the second stage
    var S1 = [3].concat(point.getX().toBigInteger().toByteArrayUnsigned());
    //console.log('S1', Bitcoin.convert.bytesToHex(S1));
    var c = Bitcoin.Crypto.SHA256(S1, {asBytes: true});
    return c;
}


/*
 * Get the stealth address for a public key
 * @param {Object} mpPubKey Public key as byte array
 */
Stealth.getStealthAddress = function(mpPubKey) {
    var stealth = [6].concat(mpPubKey.concat([0,0,0,0,0]));
    return stealth;
}

/*
 * Generate a key and related address to send to for a stealth address
 * @param {Object} pubKey Public key as byte array
 */
Stealth.initiateStealth = function(pubKey) {
    // new magic key
    var encKey = new Bitcoin.Key();
    var ephemKey = encKey.getPubPoint().getEncoded(true);

    var decKey = Stealth.importPublic(pubKey);
    var c = Stealth.stealthDH(encKey.priv, decKey)

    // Now generate address
    var bytes = decKey.getPubPoint()
                          .add(new Bitcoin.Key(c).getPubPoint())
                          .getEncoded(true);
    // Turn to address
    var mpKeyHash = Bitcoin.Util.sha256ripe160(bytes);
    var address = new Bitcoin.Address(mpKeyHash);
    return [address, ephemKey]
}

/*
 * Generate key for receiving for a stealth address with a given ephemkey
 * @param {Object} masterSecret Secret as byte array
 * @param {Object} ephemKey Ephemeral key data as byte array
 */
Stealth.uncoverStealth = function(masterSecret, ephemKey) {
    var ecN = new Bitcoin.BigInteger("115792089237316195423570985008687907852837564279074904382605163141518161494337");
    var priv = Bitcoin.BigInteger.fromByteArrayUnsigned(masterSecret.slice(0, 32));

    var decKey = Stealth.importPublic(ephemKey);
    var c = Stealth.stealthDH(priv, decKey)

    // Generate the specific secret for this keypair from our master
    var secretInt = priv
                        .add(Bitcoin.BigInteger.fromByteArrayUnsigned(c))
                        .mod(ecN)

    console.log('secretInt', secretInt.toString());

    // generate point in curve...
    var finalKey = new Bitcoin.Key(secretInt);
    finalKey.compressed = true;
    console.log(finalKey.getBitcoinAddress().toString());
    return finalKey;
}

/*
 * Build the stealth nonce output so it can be addred to a transaction.
 * returns a Bitcoin.TransactionOut object.
 * @param {Object} ephemKey Ephemeral key data as byte array
 * @param {Number} nonce Nonce for the output
 */
Stealth.buildNonceOutput = function(ephemKey, nonce) {
    var ephemScript = new Bitcoin.Script();
    ephemScript.writeOp(Bitcoin.Opcode.map.OP_RETURN);
    var nonceBytes = Bitcoin.Util.numToBytes(nonce, 4);
    ephemScript.writeBytes([6].concat(nonceBytes.concat(ephemKey)));
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
    DarkWallet.keyRing.identities[identity].wallet.getPrivateKey([0], password, function(privKey) {
        Stealth.uncoverStealth(privKey.key.export('bytes').slice(0,32), ephemkey);
    });
}


Stealth.addStealth = function(recipient, newTx) {
    var stealthData, outHash, ephemKey, nonce;
    var stealthBytes = Bitcoin.base58.checkDecode(recipient);
    var stealthPrefix = stealthBytes.slice(33, 38);
    // iterate since we might not find a nonce for our required prefix then
    // we need to create a new ephemkey
    do {
        stealthData = Stealth.initiateStealth(stealthBytes.slice(0,33));
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

