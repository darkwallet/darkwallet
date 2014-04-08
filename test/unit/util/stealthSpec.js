/*
 * @fileOverview Stealth support.
 */

define(['util/stealth', 'bitcoinjs-lib'], function(Stealth, Bitcoin) {

  var scanKeyBytes = [250, 99, 82, 30, 51, 62, 75, 159, 106, 152, 161, 66, 104, 13, 58, 239, 77, 142, 127, 121, 114, 60, 224, 4, 54, 145, 219, 85, 195, 107, 217, 5];
  var spendKeyBytes = [220, 193, 37, 11, 81, 192, 240, 58, 228, 233, 120, 224, 37, 110, 222, 81, 220, 17, 68, 227, 69, 201, 38, 38, 43, 151, 23, 177, 188, 201, 189, 27];

  var scanKey = new Bitcoin.Key(scanKeyBytes, true);
  var spendKey = new Bitcoin.Key(spendKeyBytes, true);

  var scanKeyPubBytes = scanKey.getPub().export('bytes');
  var spendKeyPubBytes = spendKey.getPub().export('bytes');

  describe('Stealth library', function() {
    it('imports a public component', function() {
      var Q = scanKeyPubBytes;
      var pubKey = Stealth.importPublic(Q);
      expect(pubKey.export('bytes')).toEqual(Q)
    });
    
    it('performs curvedh and stealth formatting', function() {
      var e = scanKey.priv;
      var decKey = spendKey.getPub();
      Stealth.stealthDH(e, decKey);
    });
    
    it('formats a stealth address in base58', function() {
      var spendPubKeys = [spendKeyPubBytes];
      var formatted = Stealth.formatAddress(scanKeyPubBytes, spendPubKeys);
      expect(formatted).toEqual("6aeUQj9EHB2hFowamkWWxfPQRwqUkHwKqve4wYNpuueHfkhSu877zGWgqceDzfyk99q2vRSev8FQAit8797kna96v4rf4tx5KKfrtj7");
    });
    
    it('parses a stealth address into its forming parts', function() {
      var stealthAddress = "6aeUQj9EHB2hFowamkWWxfPQRwqUkHwKqve4wYNpuueHfkhSu877zGWgqceDzfyk99q2vRSev8FQAit8797kna96v4rf4tx5KKfrtj7";
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

      var res = Stealth.initiateStealth(scanBytes, spendBytes);
      var address = res[0];
      var ephemKey = res[1];

      // Can't test more since the result is generated internally
      expect(res.length).toBe(2)
    });

    it('generates an address for receiving for a spend key with the given ephemkey', function() {
      var scanSecret = scanKeyBytes;
      var ephemBytes = [2, 41, 62, 69, 146, 69, 71, 35, 185, 14, 221, 88, 77, 96, 134, 251, 22, 89, 129, 39, 226, 6, 235, 188, 99, 232, 218, 166, 229, 202, 228, 173, 172];
      var spendBytes = spendKeyPubBytes;
      var keyBytes = Stealth.uncoverStealth(scanSecret, ephemBytes, spendBytes);

      expect(keyBytes).toEqual([2, 188, 218, 104, 11, 243, 22, 102, 48, 223, 180, 72, 199, 181, 56, 51, 36, 18, 209, 125, 63, 181, 38, 19, 158, 54, 247, 1, 229, 136, 76, 236, 245]);
    });

    it('derives public key bytes', function() {
      var spendKey = new Bitcoin.ECPubKey(spendKeyPubBytes);
      var c = new Bitcoin.BigInteger("10000");
      var keyBytes = Stealth.deriveKey(spendKey, c);

      expect(keyBytes).toEqual([3, 173, 36, 66, 71, 110, 69, 203, 135, 107, 57, 44, 117, 28, 232, 195, 123, 20, 36, 239, 18, 50, 107, 196, 154, 84, 37, 176, 43, 123, 246, 179, 204]);
    });
    
    it('derives addresses', function() {
      var spendKey = new Bitcoin.ECPubKey(spendKeyPubBytes);
      var c = new Bitcoin.BigInteger("1000");
      var address = Stealth.deriveAddress(spendKey, c);

      expect(address.toString()).toBe("1EKg16C2fVCDK8GGzABsSbVVAeL1z7yrAh");
    });
    
    it('builds the stealth nonce output', function() {
      var nonce = 20;
      var ephemBytes = [2, 41, 62, 69, 146, 69, 71, 35, 185, 14, 221, 88, 77, 96, 134, 251, 22, 89, 129, 39, 226, 6, 235, 188, 99, 232, 218, 166, 229, 202, 228, 173, 172];
      var stealthOut = Stealth.buildNonceOutput(ephemBytes, nonce)
      // TODO: check output
    });
    
    it('checks prefix against the given array', function() {
      // prefix with size 0
      var stealthPrefix = [0, 255, 1, 2, 3];
      var outHash = [255,8,9,7,12,54,67];
      var res = Stealth.checkPrefix(outHash, stealthPrefix);
      expect(res).toBe(true);

      // prefix with size 8
      stealthPrefix = [8, 255, 1, 2, 3];
      outHash = [255,1,2,3,12,54,67];
      res = Stealth.checkPrefix(outHash, stealthPrefix);
      expect(res).toBe(true);

      // prefix with size 8, not equal
      stealthPrefix = [8, 255, 1, 2, 3];
      outHash = [254,255,2,3,12,54,12];
      res = Stealth.checkPrefix(outHash, stealthPrefix);
      expect(res).toBe(false);
    });
    
    it('adds stealth output to the given transaction and return destination address', function() {
      var recipient = "6aeUMgXdvVaZeDnVVu1nuTmmr7rCCRyGMXTdN7Wafhem8PrDx7uhHpmU4AWfqYb1HLUymXe2P1Vw7HfVGtEiF5noNUkaYY18UvXjuiw";
      var newTx = new Bitcoin.Transaction();
      var recipient = Stealth.addStealth(recipient, newTx);
      // TODO: check output
    });
  });
});
