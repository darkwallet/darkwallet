/*
 * @fileOverview Stealth support.
 */
'use strict';

define(['util/stealth', 'bitcoinjs-lib'], function(Stealth, Bitcoin) {

  var bufToArray = function(obj) {return Array.prototype.slice.call(obj, 0);};

  // Data for the test
  var ephemKeyBytes = [95, 112, 167, 123, 50, 38, 10, 122, 50, 198, 34, 66, 56, 31, 186, 44, 244, 12, 14, 32, 158, 102, 90, 121, 89, 65, 142, 174, 79, 45, 162, 43, 1];
  var scanKeyBytes = [250, 99, 82, 30, 51, 62, 75, 159, 106, 152, 161, 66, 104, 13, 58, 239, 77, 142, 127, 121, 114, 60, 224, 4, 54, 145, 219, 85, 195, 107, 217, 5];
  var spendKeyBytes = [220, 193, 37, 11, 81, 192, 240, 58, 228, 233, 120, 224, 37, 110, 222, 81, 220, 17, 68, 227, 69, 201, 38, 38, 43, 151, 23, 177, 188, 201, 189, 27];

  var ephemKey = Bitcoin.ECKey.fromBytes(ephemKeyBytes, true);
  var scanKey = Bitcoin.ECKey.fromBytes(scanKeyBytes, true);
  var spendKey = Bitcoin.ECKey.fromBytes(spendKeyBytes, true);

  var ephemKeyPubBytes = ephemKey.pub.toBytes();
  var scanKeyPubBytes = scanKey.pub.toBytes();
  var spendKeyPubBytes = spendKey.pub.toBytes();

  // Address created from the above keys
  var testAddress = "vJmxHgVSxtBcoe9JQTz9qKN8ZnKcehm37FWwSfejU4AeBuxB8sX6hVPCh2iUJsAdVpbgRdUd3CUPzUCgDmLne6tccTL379SLKv15iK";

  describe('Stealth library', function() {
    it('imports a public component', function() {
      var Q = scanKeyPubBytes;
      var pubKey = Stealth.importPublic(Q);
      expect(pubKey.toBytes()).toEqual(Q)
    });
    
    it('performs curvedh and stealth formatting', function() {
      var e = scanKey.d;
      var decKey = spendKey.pub;
      Stealth.stealthDH(e, decKey);
    });
    
    it('formats a stealth address in base58', function() {
      var spendPubKeys = [spendKeyPubBytes];
      var formatted = Stealth.formatAddress(scanKeyPubBytes, spendPubKeys);

      expect(formatted).toEqual(testAddress);
    });
    
    it('parses a stealth address into its forming parts', function() {
      var stealthAddress = testAddress;
      var parsed = Stealth.parseAddress(stealthAddress);

      expect(parsed.options.reuseScan).toEqual(0);
      expect(parsed.scanKey).toEqual(scanKeyPubBytes);
      expect(parsed.spendKeys).toEqual([spendKeyPubBytes]);
      expect(parsed.sigs).toEqual(1);
      expect(parsed.prefix).toEqual([0]);
    });
    
    it('generates a key and related address to send to for a stealth address', function() {
      var scanBytes = scanKeyPubBytes;
      var spendBytes = spendKeyPubBytes;

      var res = Stealth.initiateStealth(scanBytes, spendBytes, undefined, ephemKeyBytes);
      var address = res[0];
      var ephemKey = res[1];

      expect(ephemKey).toEqual(ephemKeyPubBytes)
      expect(address.toString()).toEqual("1Gvq8pSTRocNLDyf858o4PL3yhZm5qQDgB")

      // try with no ephemKeyBytes so it will be generated (normal case)
      res = Stealth.initiateStealth(scanBytes, spendBytes);
      expect(res.length).toBe(3);
    });

    it('uncovers the stealth secret', function() {
      var secret = "34053245118207293422371795779243906008263774607703744573712190846512548332868";
      var c = Stealth.uncoverStealth(scanKeyBytes, ephemKeyPubBytes);
      expect(c.toString()).toEqual(secret.toString());
    });

    it('generates an address for receiving for a spend key with the given ephemkey', function() {
      var scanSecret = scanKeyBytes;
      var ephemBytes = ephemKeyPubBytes;
      var spendBytes = spendKeyPubBytes;
      var keyBytes = Stealth.uncoverPublic(scanSecret, ephemBytes, spendBytes);

      expect(Array.prototype.slice.call(keyBytes, 0)).toEqual([3, 5, 246, 185, 154, 68, 162, 189, 236, 139, 72, 79, 252, 238, 86, 28, 249, 160, 195, 183, 234, 146, 234, 142, 99, 52, 230, 251, 196, 241, 193, 120, 153]);

      var keyHash = Bitcoin.crypto.hash160(keyBytes);
      var address = new Bitcoin.Address(keyHash, Bitcoin.networks.bitcoin.pubKeyHash);

      expect(address.toString()).toBe("1Gvq8pSTRocNLDyf858o4PL3yhZm5qQDgB");
    });
    
    it('derives a private key from spend key and shared secret', function() {
      var privKey = Stealth.uncoverPrivate(scanKeyBytes, ephemKeyPubBytes, spendKeyBytes);
      var keyBytes = privKey.pub.toBytes();

      var keyHash = Bitcoin.crypto.hash160(new Bitcoin.Buffer(keyBytes));
      var address = new Bitcoin.Address(keyHash, Bitcoin.networks.bitcoin.pubKeyHash);
      expect(address.toString()).toBe("1Gvq8pSTRocNLDyf858o4PL3yhZm5qQDgB");
    });

    it('derives public key from spend key and shared secret', function() {
      var spendKey = Bitcoin.ECPubKey.fromBytes(spendKeyPubBytes);
      var c = new Bitcoin.BigInteger("10000");
      var keyBytes = Stealth.derivePublicKey(spendKey, c);

      expect(bufToArray(keyBytes)).toEqual([3, 173, 36, 66, 71, 110, 69, 203, 135, 107, 57, 44, 117, 28, 232, 195, 123, 20, 36, 239, 18, 50, 107, 196, 154, 84, 37, 176, 43, 123, 246, 179, 204]);
    });
    
    it('derives a bitcoin address from spendkey and shared secret', function() {
      var spendKey = Bitcoin.ECPubKey.fromBytes(spendKeyPubBytes);
      var c = new Bitcoin.BigInteger("1000");
      var address = Stealth.deriveAddress(spendKey, c);

      expect(address.toString()).toBe("1EKg16C2fVCDK8GGzABsSbVVAeL1z7yrAh");
    });
    
    it('builds the stealth nonce output', function() {
      var nonce = 20;
      var ephemBytes = ephemKeyPubBytes;
      var script = Stealth.buildNonceScript(ephemBytes, nonce)

      //expect(stealthOut.value).toBe(0);
      expect(script.buffer.length).toBe(2+1+4+33);
      expect(script.buffer[2]).toBe(Stealth.nonceVersion);
      // TODO: is this correct or should be [0,0,0,20]?
      expect(bufToArray(script.buffer.slice(3,7))).toEqual([20,0,0,0]);
      expect(bufToArray(script.buffer.slice(7,40))).toEqual(ephemBytes);
    });
    
    it('checks prefix against the given array', function() {
      // prefix with size 0
      var stealthPrefix = [0, 255, 1, 2, 3];
      var outHash = [255,8,9,7,12,54,67];
      var res1 = Stealth.checkPrefix(outHash, stealthPrefix);

      // prefix with size 8
      stealthPrefix = [8, 255, 1, 2, 3];
      outHash = [255,1,2,3,12,54,67];
      var res2 = Stealth.checkPrefix(outHash, stealthPrefix);

      // prefix with size 13
      stealthPrefix = [13, 255, 255, 2, 3];
      outHash = [255,248,2,3,12,54,67];
      var res3 = Stealth.checkPrefix(outHash, stealthPrefix);

      // prefix with size 13, last bit fail
      stealthPrefix = [13, 255, 255, 2, 3];
      outHash = [255,240,2,3,12,54,67];
      var res4 =   Stealth.checkPrefix(outHash, stealthPrefix);


      // prefix with size 8, not equal
      stealthPrefix = [8, 255, 1, 2, 3];
      outHash = [254,255,2,3,12,54,12];
      var res5 = Stealth.checkPrefix(outHash, stealthPrefix);

      expect(res1).toBe(true);
      expect(res2).toBe(true);
      expect(res3).toBe(true);
      expect(res4).toBe(false);
      expect(res5).toBe(false);
    });
    
    it('adds stealth output to the given transaction and return destination address', function() {
      var newTx = new Bitcoin.Transaction();
      var recipient = Stealth.addStealth(testAddress, newTx, undefined, undefined, ephemKeyBytes, 1);

      expect(recipient.address.toString()).toBe("1Gvq8pSTRocNLDyf858o4PL3yhZm5qQDgB");
      expect(newTx.outs.length).toBe(1);
      var outBuffer = newTx.outs[0].script.chunks[1];
      expect(newTx.outs[0].script.chunks[0]).toBe(Bitcoin.opcodes.OP_RETURN); // OP_RETURN
      expect(outBuffer[0]).toBe(Stealth.nonceVersion);
      expect(Array.prototype.slice.call(outBuffer, 1, 5)).toEqual([1,0,0,0]);
      expect(newTx.outs[0].script.buffer)
    });
  });
});
