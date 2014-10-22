'use strict';

define(['bitcoinjs-lib', 'util/stealth', 'crypto-js'], function(Bitcoin, Stealth, CryptoJS) {
  var convert = Bitcoin.convert;

  var genesisTime = 1231006505;
  var tzOffset = (new Date()).getTimezoneOffset()*60;

  var allowedVersions = [Bitcoin.networks.bitcoin.pubKeyHash, Bitcoin.networks.bitcoin.scriptHash, Stealth.version];

  function isSmallIntOp(opcode) {
    return ((opcode == Bitcoin.opcodes.OP_0) ||
    ((opcode >= Bitcoin.opcodes.OP_1) && (opcode <= Bitcoin.opcodes.OP_16)))
  }

  var BtcUtils = {
    lastBlock: 296405,
    lastTimestamp: 1397780085,
    blockDiff: 562.65,

    /*
     * Set timestamp for the last block to adjust timestamp heuristics
     */
    setLastTimestamp: function(block, timestamp) {
        BtcUtils.lastBlock = block;
        BtcUtils.lastTimestamp = timestamp;
        BtcUtils.blockDiff = ((timestamp-genesisTime) / block);
    },

    /**
     * Get the address for an input
     */
    getInputAddress: function(anIn, versions) {
        if (!versions) throw Error("No versions!");
        return Bitcoin.Address.fromInputScript(anIn.script, Bitcoin.networks[versions.network]).toString();
    },

    /*
     * Decode a block header
     */
    decodeBlockHeader: function(headerHex) {
        // Don't really need all of these at the moment
        var header = convert.hexToBytes(headerHex);
        var version = convert.bytesToNum(header.splice(0,4));
        var prevBlock = header.splice(0,32);
        var merkleRoot = header.splice(0,32);
        var timestamp = convert.bytesToNum(header.splice(0,4));
        var difficulty = header.splice(0,4);
        var nonce = convert.bytesToNum(header.splice(0,4));
        var difficultyNum = convert.bytesToNum(header.splice(0,4));

        return {version: version, prevBlock: prevBlock, merkleRoot: merkleRoot, timestamp: timestamp, difficulty: difficulty, nonce: nonce};
    },
    /*
     * Start a multisig structure out of participant public keys and m
     */
    multiSig: function(m, participants, version){
        if (version === null || version == undefined) version = Bitcoin.networks.bitcoin.scriptHash;
        // Create script
        var pubKeys = [];
        participants.sort();
        participants.forEach(function(participant) {
            pubKeys.push(Bitcoin.ECPubKey.fromBuffer(new Bitcoin.Buffer(participant)));
        });
        var script = Bitcoin.scripts.multisigOutput(m, pubKeys); //Bitcoin.Script.createMultiSigOutputScript(m, participants);
        // Hash for address
        var hashed = Bitcoin.crypto.hash160(script.buffer);
        // Encode in base58, v0x05 is multisig
        var address = new Bitcoin.Address(hashed, version).toString();
        // Encoded script
        var scriptHex = script.buffer.toString('hex');
        return {address: address, script: scriptHex, m: m, pubKeys: participants};
    },

    deriveMpk: function(mpk, index) {
        var mpKey = Bitcoin.HDNode.fromBase58(mpk);
        var childKey = mpKey.derive(index);
        return childKey.toBase58(false);
    },

    importMultiSig: function(data, version){
        if (version === null || version == undefined) version = Bitcoin.networks.bitcoin.scriptHash;
        var script = Bitcoin.Script.fromBuffer(new Bitcoin.Buffer(data, 'hex'));
        var hashed = Bitcoin.crypto.hash160(script.buffer);
        var address = new Bitcoin.Address(hashed, version).toString();
        var n = script.chunks[script.chunks.length-2] - Bitcoin.opcodes.OP_1 + 1;
        var pubKeyBufs = script.chunks.slice(1,1+n)
        var m = script.chunks[0] - Bitcoin.opcodes.OP_1 + 1;
        var pubKeys = [];
        pubKeyBufs.forEach(function(pubKey) {
             pubKeys.push(Array.prototype.slice.call(pubKey, 0))
        });
        return {address: address, script: data, m: m, pubKeys: pubKeys};
    },

    /*
     *  Uncompress a public address
     */
    compressPublicKey: function(bytes) {
        var key = Bitcoin.ECPubKey.fromBytes(bytes, false);
        return key.toBytes(true);
    },

    /*
     *  Uncompress a public address
     */
    uncompressPublicKey: function(bytes) {
        var key = Bitcoin.ECPubKey.fromBytes(bytes, true);
        return key.toBytes(false);
    },

    /*
     * See if this is a valid address
     */
    isAddress: function(address, allowed) {
       if (!allowed) allowed = allowedVersions;
       if (address) {
          // Check for base58 encoded addresses
          if (Bitcoin.Address.validate(address) && allowed.indexOf(Bitcoin.Address.getVersion(address)) != -1) {
            return true;
          }
        }
    },

    /*
     * Validate an address
     */
    validateAddress: function(address, allowed) {
       if (!allowed) allowed = allowedVersions;
       if (address) {
          // Check for base58 encoded addresses
          if (BtcUtils.isAddress(address, allowed)) {
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
    
    parseURI: function(uri) {
      uri = decodeURIComponent(uri);
      var pars = {};
      var req; // BIP-0021
      pars.address = uri.replace('bitcoin:', '').split('?')[0];
      if (uri.split('?')[1]) {
        uri.split('?')[1].split('&').forEach(function(parsed) {
          if(parsed) {
            pars[parsed.split('=')[0]] = parsed.split('=')[1];
            if (parsed.split('=')[0].indexOf('req-') == 0) {
              req = true;
            }
          }
        });
      }
      return !req ? pars : null;
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
        var bytes;
        if (compressed === undefined) {
            compressed = true;
        }
        if (address.length == 130) {
            // Hex uncompressed address
            bytes = convert.hexToBytes(address)
        } else if (address.length == 66) {
            // Hex compressed address
            bytes = convert.hexToBytes(address);
        } else if (address.length >= 102 && (address[0] == 'v' || address[0] == 'w')) {
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
            var mpKey = Bitcoin.HDNode.fromBase58(address);
            bytes = mpKey.pubKey.toBytes(false);
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
    heightToTimestamp: function(height, diff) {
        diff = diff || BtcUtils.blockDiff;
        return (genesisTime+(height*diff))*1000;
    },
    // Calculate hash for a raw hex transaction
    hash256: function(txHex) {
        var SHA256 = CryptoJS.SHA256;
        var buffer = convert.bytesToWordArray(convert.hexToBytes(txHex));
        var hash = convert.wordArrayToBytes(SHA256(SHA256(buffer)));
        return convert.bytesToHex(hash);
    }
  };

  return BtcUtils;
});
