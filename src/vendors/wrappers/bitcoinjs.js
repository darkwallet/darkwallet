/**
 * bitcoinjs-lib backwards compatibility lib
 * exposes some old functions for easily backporting
 */

'use strict';

define(['bitcoinjs-lib-real', 'convert'], function(Bitcoin, Convert) {
    console.log("loading bitcoinjs-lib-real");
    Bitcoin.Address.validate = function(address) {
        try {
            Bitcoin.base58check.decode(address);
            return true;
        } catch (e) {
            return false;
        }
    }
    Bitcoin.Address.fromInputScript = function(script, network) {
      network = network || Bitcoin.networks.bitcoin

      var type = Bitcoin.scripts.classifyInput(script)

      if (type === 'pubkey') {
          var hash = Bitcoin.crypto.hash160(script.chunks[0]);
          return new Bitcoin.Address(hash, network.pubKeyHash);
      }
      if (type === 'pubkeyhash') {
          var hash = Bitcoin.crypto.hash160(script.chunks[1]);
          return new Bitcoin.Address(hash, network.pubKeyHash);
      }
      if (type === 'scripthash') {
          var hash = Bitcoin.crypto.hash160(script.chunks[script.chunks.length-1]);
          return new Bitcoin.Address(hash, network.scriptHash);
      }

      // throw Error(type + ' has no matching Address')
    }

    Bitcoin.Address.getVersion = function(address) {
        return Bitcoin.base58check.decode(address).readUInt8(0);
    }

    Bitcoin.ECKey.fromBytes = function(bytes, compressed) {
        if (!bytes) {
            return Bitcoin.ECKey.makeRandom(compressed);
        }
        var d = Bitcoin.BigInteger.fromByteArrayUnsigned(bytes.slice(0, 32));
        if (compressed === null || compressed === undefined) compressed = (bytes[32] === 1);
        return new Bitcoin.ECKey(d, compressed);
    }
    Bitcoin.ECPubKey.fromBytes = function(bytes) {
        return Bitcoin.ECPubKey.fromBuffer(new Bitcoin.Buffer(bytes));
    }
    Bitcoin.ECKey.prototype.toBytes = function() {
         var bytes = this.d.toBuffer().toJSON().data;
         while(bytes.length < 32) bytes.unshift(0);
         if (this.pub.compressed) bytes.push(1);
         return bytes;
    }
    Bitcoin.ECPubKey.prototype.toBytes = function(compressed) {
         if (compressed === undefined) compressed = this.compressed;
         return this.Q.getEncoded(compressed).toJSON().data;
    }
    Bitcoin.convert = Convert;
    return Bitcoin;

});

