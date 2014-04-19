define(['bitcoinjs-lib', 'util/stealth'], function(Bitcoin, Stealth) {
  var convert = Bitcoin.convert;

  var genesisTime = 1231006505;
  var block296405 = 1397780085;
  var blockDiff = ((block296405-genesisTime) / 296405);

  var allowedVersions = [Bitcoin.network.mainnet.addressVersion, Bitcoin.network.mainnet.p2shVersion, Stealth.version];

  var BtcUtils = {
    /*
     * Start a multisig structure out of participant public keys and m
     */
    multiSig: function(m, participants){
        // Create script
        var script = Bitcoin.Script.createMultiSigOutputScript(m, participants);
        // Hash for address
        var hashed = Bitcoin.crypto.hash160(script.buffer);
        // Encode in base58, v0x05 is multisig
        var address = Bitcoin.base58check.encode(hashed, 0x05);
        // Encoded script
        var scriptHex = convert.bytesToHex(script.buffer);
        return {address: address, script: scriptHex, m: m, pubKeys: participants};
    },

    deriveMpk: function(mpk, index) {
        var mpKey = Bitcoin.HDWallet.fromBase58(mpk);
        var childKey = mpKey.derive(index);
        return childKey.toBase58(false);
    },

    importMultiSig: function(data){
        var script = new Bitcoin.Script(convert.hexToBytes(data));
        var hashed = Bitcoin.crypto.hash160(script.buffer);
        var address = Bitcoin.base58check.encode(hashed, 0x05);
        var pubKeys = script.extractPubkeys();
        var m = script.chunks[0] - Bitcoin.Opcode.map.OP_1 + 1;
        return {address: address, script: data, m: m, pubKeys: pubKeys};
    },

    /*
     *  Uncompress a public address
     */
    compressPublicKey: function(bytes) {
        var key = Bitcoin.ECPubKey(bytes, false);
        return key.toBytes(true);
    },

    /*
     *  Uncompress a public address
     */
    uncompressPublicKey: function(bytes) {
        var key = Bitcoin.ECPubKey(bytes, true);
        return key.toBytes(false);
    },

    /*
     * Validate an address
     */
    validateAddress: function(address) {
       if (address) {
          // Check for base58 encoded addresses
          if (Bitcoin.Address.validate(address) && allowedVersions.indexOf(Bitcoin.Address.getVersion(address)) != -1) {
            return true;
          }
          // Check for public keys in different formats
          try {
            BtcUtils.extractPublicKey(address);
            return true;
          } catch (e) {
          }
        }
    },

    /*
     * Decode an address from string to bytes
     * Supports the following formats:
     *  - uncompressed hex
     *  - compressed hex
     *  - stealth (6...)
     *  - mpk (xpub...)
     */
    extractPublicKey: function(address, compressed) {
        if (compressed === undefined) {
            compressed = true;
        }
        if (address.length == 130) {
            // Hex uncompressed address
            bytes = convert.hexToBytes(address)
        } else if (address.length == 66) {
            // Hex compressed address
            bytes = convert.hexToBytes(address);
        } else if (address.length == 103 && address[0] == '6') {
            // Stealth address
            var parsed = Stealth.parseAddress(address);
            // Take the first spendKey otherwise the scanKey
            if (parsed.spendKeys.length) {
                bytes = parsed.spendKeys[0];
            } else {
                bytes = parsed.scanKey;
            }
        } else if (address.length == 111 && address.slice(0,4) == 'xpub') {
            // Master public key
            var mpKey = Bitcoin.HDWallet.fromBase58(address);
            bytes = mpKey.pub.toBytes(false);
        } else {
            // Unknown
            throw Error("Can't decode address for multisig with length " + address.length);
        }
        // Decompress if needed
        if (!compressed && bytes.length == 33) {
            bytes = BtcUtils.uncompressPublicKey(bytes);
        }
        else if (compressed && bytes.length == 65) {
            bytes = BtcUtils.compressPublicKey(bytes);
        }
        return bytes;
    },
    // Convert height to js timestamp
    heightToTimestamp: function(height) {
        return (genesisTime+(height*blockDiff))*1000;
    },
    // Convert height to date string
    heightToDateString: function(height) {
        var ts = BtcUtils.heightToTimestamp(height);
        var date = new Date(ts);
        return date.toLocaleDateString();
    }
  };

  return BtcUtils;
});
