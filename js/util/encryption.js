'use strict';

define(['bitcoinjs-lib', 'util/multiParty', 'util/stealth', 'util/djbec', 'crypto-js', 'sjcl'],
function (Bitcoin, multiParty, Stealth, Curve25519, CryptoJS, sjcl) {
  var BigInteger = Bitcoin.BigInteger;
  var convert = Bitcoin.convert;

  /*************************************
   * Test encrypt / decrypt using similar derivation as stealth
   */

  /*
   * Encrypt the given message
   * @param {Object} pubKey Public key as byte array
   * @param {String} Message to encrypt
   * @param {Bytes} encKeyBytes (Optional)
   */
  var stealthEncrypt = function(pubKey, message, encKeyBytes) {
    var encKey = Bitcoin.ECKey.fromBytes(encKeyBytes);
    var ephemKey = Array.prototype.slice.call(encKey.pub.Q.getEncoded(true), 0);

    var decKey = Stealth.importPublic(pubKey);
    var c = Stealth.stealthDH(encKey.d, decKey);
    var _pass = Bitcoin.convert.bytesToString(c.toBuffer().toJSON().data);
    var encrypted = sjcl.encrypt(_pass, message, {ks: 256, ts: 128});
    return {pub: ephemKey, data: sjcl.json.decode(encrypted)};
  }

  /*
   * Decrypt the given message
   * @param {Bitcoin.ECKey} pubKey Private key
   * @param {String} message Message to decrypt, should have pub and data components
   */
  var stealthDecrypt = function(privKey, message) {
    var masterSecret = privKey.toBytes();
    var priv = BigInteger.fromByteArrayUnsigned(masterSecret.slice(0, 32));

    var decKey = Stealth.importPublic(message.pub);
    var c = Stealth.stealthDH(priv, decKey);
    var _pass = Bitcoin.convert.bytesToString(c.toBuffer().toJSON().data);
    var decrypted = sjcl.decrypt(_pass, sjcl.json.encode(message.data));

    return decrypted;
  };

  /*
   * Decrypt the given message for some identity bip32 key
   * @param {String} message Message to decrypt
   * @param {DarkWallet.Identity} identity Identity to use
   * @param {Array} seq Key seq to use for decryption
   * @param {String} password Password for the user private keys
   * @param {Object} callback Callback receiving the decrypted data
   */

  var stealthDecryptForIdentity = function(message, identity, seq, password, callback) {
    identity.wallet.getPrivateKey(seq, password, function(privKey) {
        callback(stealthDecrypt(privKey, message));
    });
  };



  /*
   * pbkdf2 wrapper
   * salt must be a words
   */
  var pbkdf2 = function(password, salt, iterations) {
      // pbkdf2 using crypto-js, it's equivalent, but much slower, so using sjcl for now
      //   var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 256/32, iterations: iterations, hasher: CryptoJS.algo.SHA256 });
      //   return kdf.compute(password, salt);

      // faster sjcl implementation
      return sjcl.misc.pbkdf2(password, salt, iterations);
  };
  /*
   * Generate message tag. 8 rounds of SHA512
   * Input: WordArray
   * Output: Base64
   */
  var messageTag = function(message) {
    for (var i = 0; i !== 8; i++) {
      message = CryptoJS.SHA512(message);
    }
    return message.toString(CryptoJS.enc.Base64);
  };

  /*
   * Utility function to generate fingerprints like cryptocat
   * @param {Array} key Public key in bytes from BigInteger.toByteArrayUnsigned
   */
  var genFingerprint = function(key) {
        // Parse the key from bitcoin unsigned byte array api format
        var keyBi = Bitcoin.BigInteger.fromByteArrayUnsigned(key);
        // now hash
        return CryptoJS.SHA512(
                convert.bytesToWordArray(
                        // this bi2bytes is inverted to bitcoin one and will pad with 0's at the end
                        Curve25519.bi2bytes(keyBi, 32)
                )
        )
                .toString()
                .substring(0, 40)
                .toUpperCase();
  };

  /*
   * Adapt a private key for use with curve25519
   * Input a bitcoin priv here and out will come the protected curve25519 priv
   * @param {BigInteger} priv A Bitcoin.ECKey private component
   */
  var adaptPrivateKey = function(priv) {
      // User bi2bytes because bitcoin toByteArrayUnsigned doesn't ensure
      // 32 bytes and also gives bytes reversed (they don't use the same
      // format)
      var mysecret = Curve25519.bi2bytes(priv, 32);

      // Check http://cr.yp.to/ecdh.html to why we are doing this
      mysecret[0] &= 248;
      mysecret[31] &= 127;
      mysecret[31] |= 64;
      // Now back to a big integer
      return Curve25519.bytes2bi(mysecret);
  };

  /*
   * Generate a shared secret
   * @ careful this is curve25519 so don't just use a  bitcoin key!
   */
  var genSharedSecret = function(priv, pub) {
    var sharedSecret = CryptoJS.SHA512(
      convert.bytesToWordArray(
        Curve25519.ecDH(priv,pub).toBuffer().toJSON().data
      )
    );

    return {
    'message': CryptoJS.lib.WordArray.create(sharedSecret.words.slice(0, 8)),
    'hmac': CryptoJS.lib.WordArray.create(sharedSecret.words.slice(8, 16))
    };
  };

  /*
   * Encrypt with password derivation
   */
  var encrypt = function(password, msg, userIv, userSalt) {
    // do pbkdf2 on the password
    var salt = userSalt || CryptoJS.lib.WordArray.random(128/8);
    var encKey = pbkdf2(password, salt.words, 1000);

    // prepare for aes
    var ivWords = userIv || CryptoJS.lib.WordArray.random(12);
    var iv = CryptoJS.enc.Base64.stringify(ivWords);

    var message = CryptoJS.enc.Utf8.parse(msg);
    // Add 64 bytes of padding
    message.concat(CryptoJS.lib.WordArray.random(64));

    // encrypt
    var cypher = multiParty.encryptAES(message, encKey, iv);

    // tag
    /*
    var hmac = CryptoJS.lib.WordArray.create();
    hmac.concat(ivWords);
    hmac.concat(CryptoJS.enc.Base64.parse(cypher));
    var tag = CryptoJS.HmacSHA512(hmac, tagKey);
    */

    // TODO: should use full range to encode instead of just base64
    return {data: cypher, iv: iv, salt: CryptoJS.enc.Base64.stringify(salt), it: 1000, ks: 256, pad: 64/*, tag: CryptoJS.enc.Base64.stringify(tag)*/};
  };

  /*
   * Decrypt with password derivation
   */
  var decrypt = function(password, cypher) {
    // do pbkdf2 on the password
    var salt = CryptoJS.enc.Base64.parse(cypher.salt);
    var encKey = pbkdf2(password, salt.words, cypher.it);

    // decrypt
    var plaintext = multiParty.decryptAES(cypher.data, encKey, cypher.iv);

    // format return
    plaintext = CryptoJS.lib.WordArray.create(plaintext.words, plaintext.sigBytes-cypher.pad);

    // calculate hmac
    /*
    var hmac = CryptoJS.lib.WordArray.create();
    hmac.concat(CryptoJS.enc.Base64.parse(cypher.iv));
    hmac.concat(CryptoJS.enc.Base64.parse(cypher.data));
    var tag = CryptoJS.HmacSHA512(hmac, tagKey);
    if (tag != cypher.tag) {
        return false;
    }
    */
 
    return plaintext.toString(CryptoJS.enc.Utf8);
  };

  return {
    pbkdf2: pbkdf2,
    encrypt: encrypt,
    decrypt: decrypt,
    adaptPrivateKey: adaptPrivateKey,
    genFingerprint: genFingerprint,
    genSharedSecret: genSharedSecret,
    stealth: {
      encrypt: stealthEncrypt,
      decrypt: stealthDecrypt,
      decryptForIdentity: stealthDecryptForIdentity
    }
  };

});
