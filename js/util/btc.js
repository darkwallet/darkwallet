define(['bitcoinjs-lib', 'util/stealth'], function(Bitcoin, Stealth) {
  var convert = Bitcoin.convert;
  var BtcUtils = {
    /*
     * Start a multisig structure out of participant public keys and m
     */
    multiSig: function(m, participants){
        // Create script
        var script = Bitcoin.Script.createMultiSigOutputScript(m, participants);
        // Hash for address
        var hashed = Bitcoin.Util.sha256ripe160(script.buffer);
        // Encode in base58, v0x05 is multisig
        var address = Bitcoin.base58.checkEncode(hashed, 0x05);
        // Encoded script
        var scriptHex = convert.bytesToHex(script.buffer);
        return {address: address, script: scriptHex, m: m, pubKeys: participants};
    },

    /*
     * Decode an address from string to bytes
     * Supports the following formats:
     *  - uncompressed hex
     *  - compressed hex
     *  - stealth (S...)
     *  - mpk (xpub...)
     */
    decodeAddress: function(address) {
        if (address.length == 130) {
            // Hex uncompressed address
            bytes = convert.hexToBytes(address)
        } else if (address.length == 66) {
            // Hex compressed address
            bytes = convert.hexToBytes(address);
        } else if (address.length == 58 && address[0] == 'S') {
            // Stealth address
            bytes = Bitcoin.base58.checkDecode(address);
            bytes = bytes.slice(1,bytes.length-5);
        } else if (address.length == 111 && address.slice(0,4) == 'xpub') {
            // Master public key
            var mpKey = Bitcoin.HDWallet.fromBase58(address);
            bytes = mpKey.pub.toBytes(false);
        } else {
            // Unknown
            throw Error("Can't decode address for multisig with length " + address.length);
        }
        // Decompress if needed
        if (bytes.length == 32) {
            bytes = BtcUtils.uncompressAddress(bytes);
        }
        return bytes;
    }
  }

  return BtcUtils;
});
