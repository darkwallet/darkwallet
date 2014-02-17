/*
 * @fileOverview Stealth support.
 */

Stealth = {};

/*
 * Create a bitcoin key with just public component.
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
 */
Stealth.getStealthAddress = function(mpPubKey) {
    var stealth = [6].concat(mpPubKey.concat([0,0,0,0,0]));
    return stealth;
}

/*
 * Generate a key and related address to send to for a stealth address
 * pubKey is bytes array
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
 */
Stealth.uncoverStealth = function(masterSecret, ephemKey) {
    var ecN = new Bitcoin.BigInteger("115792089237316195423570985008687907852837564279074904382605163141518161494337");
    var priv = Bitcoin.BigInteger.fromByteArrayUnsigned(masterSecret);

    var decKey = Stealth.importPublic(ephemKey);
    var c = Stealth.stealthDH(priv, decKey)

    // Generate the specific secret for this keypair from our master
    var secretInt = priv
                        .add(Bitcoin.BigInteger.fromByteArrayUnsigned(c))
                        .mod(ecN)

    console.log('secretInt', secretInt.toString())

    // generate point in curve...
    var finalKey = new Bitcoin.Key(secretInt);
    finalKey.compressed = true;
    console.log(finalKey.getBitcoinAddress().toString());
    return finalKey;
}


/*
 * Some tests...
 */
Stealth.testFinishStealth = function(secret, ephemKey) {
    ephemKey = Bitcoin.convert.hexToBytes(ephemKey)
    secret = Bitcoin.convert.hexToBytes(secret)
    console.log(Stealth.uncoverStealth(secret, ephemKey));
}

Stealth.testStealth = function(address) {
    var bytes = Bitcoin.base58.checkDecode('1'+address);
    console.log(Stealth.initiateStealth(bytes.slice(1,34)));
}


Stealth.buildNonceOutput = function(ephemKey, nonce) {
    var ephemScript = new Bitcoin.Script();
    ephemScript.writeOp(Bitcoin.Opcode.map.OP_RETURN);
    var nonceBytes = Bitcoin.Util.numToBytes(nonce, 4);
    ephemScript.writeBytes([6].concat(nonceBytes.concat(ephemKey)));
    var stealthOut = new Bitcoin.TransactionOut({script: ephemScript, value: 0});
    return stealthOut;
}


