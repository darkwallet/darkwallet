/*
 * @fileOverview Stealth support.
 */
'use strict';

var seed1 = "12341234123412341234123412341234";
var seed2 = "12341234123412341234123412341235";

var aliceSeed = "64dca76abc9c6f0cf3d212d248c380c4622c8f93b2c425ec6a5567fd5db57e10d3e6f94a2f6af4ac2edb8998072aad92098db73558c323777abf5bd1082d970a";
var bobSeed = "87eaaac5a539ab028df44d9110defbef3797ddb805ca309f61a69ff96dbaa7ab5b24038cf029edec5235d933110f0aea8aeecf939ed14fc20730bba71e4b1110";

var alicePaymentCode = "PM8TJTLJbPRGxSbc8EJi42Wrr6QbNSaSSVJ5Y3E4pbCYiTHUskHg13935Ubb7q8tx9GVbh2UuRnBc3WSyJHhUrw8KhprKnn9eDznYGieTzFcwQRya4GA";
var bobPaymentCode = "PM8TJS2JxQ5ztXUpBBRnpTbcUXbUHy2T1abfrb3KkAAtMEGNbey4oumH7Hc578WgQJhPjBxteQ5GHHToTYHE3A1w6p7tU6KSoFmWBVbFGjKPisZDbP97";
var mpkRaw = "xpub69rc7WvFCAKrSadFDqaTPu7zbPv3zGTahx88s3AsPTqn68XQjxNzyxCN7AVugs9WYJ59E9raY5as2UuC6SevBibhc4ukJ3Tcj94NysFe3Vn";
var pCodeRaw = "PM8TJiiY15UWMN3GvaV4vZ5KDE9Hj9vUw6ivFpaxn1nedAs9oVMtzNLsYj2pQb7NdtHqeAehbyGyULjAxhxL2LUuhWk1ocwT96hBiSDjCAyLmd1EZ6Eh";
var notificationAddress = "13siQAccVAVXEqHB61Nw9ncKgseWGXyFB2";

var aliceNotification = "1JDdmqFLhpzcUwPeinhJbUPw4Co3aWLyzW";
var bobNotification = "1ChvUUvht2hUQufHBXF8NgLhW8SwE2ecGV";

var aliceToBobAddresses = [
    "141fi7TY3h936vRUKh1qfUZr8rSBuYbVBK",
    "12u3Uued2fuko2nY4SoSFGCoGLCBUGPkk6",
    "1FsBVhT5dQutGwaPePTYMe5qvYqqjxyftc",
    "1CZAmrbKL6fJ7wUxb99aETwXhcGeG3CpeA",
    "1KQvRShk6NqPfpr4Ehd53XUhpemBXtJPTL",
    "1KsLV2F47JAe6f8RtwzfqhjVa8mZEnTM7t",
    "1DdK9TknVwvBrJe7urqFmaxEtGF2TMWxzD",
    "16DpovNuhQJH7JUSZQFLBQgQYS4QB9Wy8e",
    "17qK2RPGZMDcci2BLQ6Ry2PDGJErrNojT5",
    "1GxfdfP286uE24qLZ9YRP3EWk2urqXgC4s"
];
 
var bobToAliceAddresses = [
    '17SSoP6pwU1yq6fTATEQ7gLMDWiycm68VT',
    '1KNFAqYPoiy29rTQF44YT3v9tvRJYi15Xf',
    '1HQkbVeZoLoDpkZi1MB6AgaCs5ZbxTBdZA',
    '14GfiZb1avg3HSiacMLaoG5xdfPjc1Unvm',
    '15yHVDiYJn146EKHuJiN79L9S2EZAjGVaK',
    '16LeCvYRCGKoLWBJMvGcnSb2Z5782F73Q2',
    '1DsqFwhE5EmNj8ttwdnzaEXtQoivZn8fFj',
    '1EGKGY4jcQrXjE2Wanh8CmgRaRqq1kNuKJ',
    '1HEBRPAN8ka5sBUwEkPWnGNyxMv6fckf6G',
    '1HZiWKGLBwcNGegUWVepATVHpmTXLRX4gQ'
];
var sharedSecrets = [
    'f5bb84706ee366052471e6139e6a9a969d586e5fe6471a9b96c3d8caefe86fef',
    'adfb9b18ee1c4460852806a8780802096d67a8c1766222598dc801076beb0b4d',
    '79e860c3eb885723bb5a1d54e5cecb7df5dc33b1d56802906762622fa3c18ee5',
    'd8339a01189872988ed4bd5954518485edebf52762bf698b75800ac38e32816d',
    '14c687bc1a01eb31e867e529fee73dd7540c51b9ff98f763adf1fc2f43f98e83',
    '725a8e3e4f74a50ee901af6444fb035cb8841e0f022da2201b65bc138c6066a2',
    '521bf140ed6fb5f1493a5164aafbd36d8a9e67696e7feb306611634f53aa9d1f',
    '5f5ecc738095a6fb1ea47acda4996f1206d3b30448f233ef6ed27baf77e81e46',
    '1e794128ac4c9837d7c3696bbc169a8ace40567dc262974206fcf581d56defb4',
    'fe36c27c62c99605d6cd7b63bf8d9fe85d753592b14744efca8be20a4d767c37',
];
 
define(['util/bip47', 'bitcoinjs-lib', 'bs58check'], function(PaymentCodes, Bitcoin, base58check) {
  describe('Reusable Payment Codes library', function() {
    it('creates a payment code address', function() {
      var mpk = Bitcoin.HDNode.fromBase58(mpkRaw);
      mpk.network = {bip32: {"public": 0x47}};
      var address = PaymentCodes.formatAddress(mpk)
      expect(address).toEqual(pCodeRaw);
    });
    it('creates a payment code address', function() {
      var node = PaymentCodes.parseAddress(pCodeRaw)
      expect(node.toString()).toEqual("xpub661MyMwAqRbcGfLPmd91Bi3hcwTJWfVVEsWFWU7vUXJp9XRap9hYC4BYuQwPn6FkZAkazEeAuX3DDw4eva3ruPmaYwvcbrZV8xsfCjtKYd8");
    });
    it('master pub and priv generate the same code', function() {
      var masterPriv1 = Bitcoin.HDNode.fromSeedHex(aliceSeed);
      var mpk1 = Bitcoin.HDNode.fromBase58(masterPriv1.toBase58(false));
      var code1 = PaymentCodes.formatAddress(masterPriv1)
      var code2 = PaymentCodes.formatAddress(mpk1)
      expect(code1).toEqual(code2);
    });
 
    it('creates the notification addresses', function() {
      var seeds = [aliceSeed, bobSeed];
      var results = [aliceNotification, bobNotification];
      [0, 1].forEach(function(i) {
        var masterPriv = Bitcoin.HDNode.fromSeedHex(seeds[i]);
        var mPriv = masterPriv.deriveHardened(47).deriveHardened(0).deriveHardened(0);
        var address = PaymentCodes.formatNotificationAddress(mPriv);
        expect(address.toString()).toEqual(results[i]);
      });
    });
    it('generates the same notification address from a payment code', function() {
      var node = PaymentCodes.parseAddress(pCodeRaw);
      var address = PaymentCodes.formatNotificationAddress(node);
      expect(address.toString()).toEqual(notificationAddress);
    });
    it('generates receiving addresses', function() {
      var masterPriv1 = Bitcoin.HDNode.fromSeedHex(seed1);
      var masterPriv2 = Bitcoin.HDNode.fromSeedHex(seed2);
      var mpk2 = Bitcoin.HDNode.fromBase58(masterPriv2.toBase58(false));

      var address1 = PaymentCodes.receive(masterPriv1, PaymentCodes.formatCode(mpk2), 0).getAddress();
      var address2 = PaymentCodes.receive(masterPriv1, PaymentCodes.formatCode(mpk2), 1).getAddress();
      var address3 = PaymentCodes.receive(masterPriv1, PaymentCodes.formatCode(mpk2), 2).getAddress();

      expect(address1.toString()).toEqual("1N5Q4noAtqSKp77DhFhJz1vUAJqsHmKJMn");
      expect(address2.toString()).toEqual("124kJMHpiPk6ujVsv7uUd7VJJsXEvfpnKQ");
      expect(address3.toString()).toEqual("18MQX4t2vCXm7WRaq6e6wdCEEoC68XNhW2");
    });
    it('generates sending addresses', function() {
      var masterPriv1 = Bitcoin.HDNode.fromSeedHex(seed1);
      var masterPriv2 = Bitcoin.HDNode.fromSeedHex(seed2);
      var mpk1 = Bitcoin.HDNode.fromBase58(masterPriv1.toBase58(false));
      var address1 = PaymentCodes.send(masterPriv2, PaymentCodes.formatCode(mpk1), 0).getAddress();
      var address2 = PaymentCodes.send(masterPriv2, PaymentCodes.formatCode(mpk1), 1).getAddress();
      var address3 = PaymentCodes.send(masterPriv2, PaymentCodes.formatCode(mpk1), 2).getAddress();

      // Expected '1M9etwV86ZUcrCb77UBpSfpcLT2s3FjSYR' to equal '182YPekisK7Jttr2rPKkY8Eduei6PRazyp'.

      expect(address1.toString()).toEqual("1N5Q4noAtqSKp77DhFhJz1vUAJqsHmKJMn");
      expect(address2.toString()).toEqual("124kJMHpiPk6ujVsv7uUd7VJJsXEvfpnKQ");
      expect(address3.toString()).toEqual("18MQX4t2vCXm7WRaq6e6wdCEEoC68XNhW2");
    });

    it('Masks payment codes', function() {
      var code = base58check.decode("PM8TJiiY15UWMN3GvaV4vZ5KDE9Hj9vUw6ivFpaxn1nedAs9oVMtzNLsYj2pQb7NdtHqeAehbyGyULjAxhxL2LUuhWk1ocwT96hBiSDjCAyLmd1EZ6Eh").slice(1);
      code = new Bitcoin.Buffer(code);
      var mask = new Bitcoin.Buffer(64);
      mask.writeUInt8(0xff, 0);
      // masking
      var masked = PaymentCodes.maskCode(code, mask);
      expect(masked.toString("base64")).toEqual("AQADBycAIec/66raWcem+2WMO2HU2i1Q0gdrXQkaLGz4gCHU1YIpriOWFxdgWs5hf7MeRrdpLaJm6BTw0Dh/9FAqUQAAAAAAAAAAAAAAAAA=");
      expect(masked.toString("base64")==code.toString("base64")).toBe(false)

      // check original code is not modified
      expect(code.toString("base64")).toEqual("AQAD+CcAIec/66raWcem+2WMO2HU2i1Q0gdrXQkaLGz4gCHU1YIpriOWFxdgWs5hf7MeRrdpLaJm6BTw0Dh/9FAqUQAAAAAAAAAAAAAAAAA=");

      // unmasking
      var unmasked = PaymentCodes.maskCode(masked, mask);
      expect(unmasked).toEqual(code);
    });

    it('Creates notification payload', function() {
      //PaymentCodes.createNotificationPayload(output, input, myMpk, otherCode);
    });

    it('Creates notification tx', function() {
      var masterPriv1 = Bitcoin.HDNode.fromSeedHex(seed1);
      var masterPriv2 = Bitcoin.HDNode.fromSeedHex(seed2);
      var mpk1 = Bitcoin.HDNode.fromBase58(masterPriv1.toBase58(false));
      var otherCode = PaymentCodes.formatCode(mpk1);
      var tx = PaymentCodes.createNotification({receive: "ca4524224f482f23ff8306b1e3a5dba18d55e9647b1241a8fecbde5724b723a7:1", value: 0.3498}, Bitcoin.ECKey.fromWIF("L1vtdMMeFPqiiVyhNtzG3KWoDU8vd76G1K5YFeETyDcodSRaALgW"),  masterPriv2, otherCode);
      expect(tx.ins.length).toBe(1);
      expect(tx.outs.length).toBe(2);
      expect(tx.outs[0].script.toBuffer().length).toBe(25);
      expect(tx.outs[1].script.toBuffer().length).toBe(83);
    });
    
    it('Receives notifications', function() {
      var masterPriv1 = Bitcoin.HDNode.fromSeedHex(seed1);
      var masterPriv2 = Bitcoin.HDNode.fromSeedHex(seed2);
      var mpk1 = Bitcoin.HDNode.fromBase58(masterPriv1.toBase58(false));
      var mpk2 = Bitcoin.HDNode.fromBase58(masterPriv2.toBase58(false));
      var sendingCode = PaymentCodes.formatCode(mpk2);
      var otherCode = PaymentCodes.formatCode(mpk1);
      var privKey = Bitcoin.ECKey.fromWIF("L1vtdMMeFPqiiVyhNtzG3KWoDU8vd76G1K5YFeETyDcodSRaALgW");
      var tx = PaymentCodes.createNotification({receive: "ca4524224f482f23ff8306b1e3a5dba18d55e9647b1241a8fecbde5724b723a7:1", value: 0.3498}, privKey,  mpk2, otherCode);

      // Now receive the notification
      var peerCode = PaymentCodes.receiveNotification(tx, masterPriv1, privKey.pub);
      // Check the sending payment code is the received one
      expect(peerCode.toString("hex")).toEqual(sendingCode.toString("hex"));
    });
    
    it('Gets alice and bob payment codes all right', function() {
      var masterPriv1 = Bitcoin.HDNode.fromSeedHex(aliceSeed);
      var masterPriv2 = Bitcoin.HDNode.fromSeedHex(bobSeed);
      var mPriv1 = masterPriv1.deriveHardened(47).deriveHardened(0).deriveHardened(0);
      var mPriv2 = masterPriv2.deriveHardened(47).deriveHardened(0).deriveHardened(0);
      var code1 = PaymentCodes.formatAddress(mPriv1);
      var code2 = PaymentCodes.formatAddress(mPriv2);
      expect(code1).toEqual(alicePaymentCode);
      expect(code2).toEqual(bobPaymentCode);
    
    });

    it('Gets alice to bob addresses all right', function() {
      var masterPriv1 = Bitcoin.HDNode.fromSeedHex(aliceSeed);
      var masterPriv2 = Bitcoin.HDNode.fromSeedHex(bobSeed);
      var mPriv1 = masterPriv1.deriveHardened(47).deriveHardened(0).deriveHardened(0);
      var mPriv2 = masterPriv2.deriveHardened(47).deriveHardened(0).deriveHardened(0);
      var code1 = PaymentCodes.formatCode(mPriv1);
      var code2 = PaymentCodes.formatCode(mPriv2);

      var results = aliceToBobAddresses;

      for(var i=0; i<results.length; i++) {
          var address = PaymentCodes.send(mPriv1, code2, i).getAddress();
          expect(address.toString()).toEqual(results[i]);
      }
    });
    it('Calculates shared secrets all right', function() {
      var masterPriv1 = Bitcoin.HDNode.fromSeedHex(aliceSeed);
      var masterPriv2 = Bitcoin.HDNode.fromSeedHex(bobSeed);
      var mPriv1 = masterPriv1.deriveHardened(47).deriveHardened(0).deriveHardened(0);
      var mPriv2 = masterPriv2.deriveHardened(47).deriveHardened(0).deriveHardened(0);

      var results = sharedSecrets;

      var privKey = mPriv1.derive(0).privKey;
      for(var i=0; i<results.length; i++) {
          var pubKey = mPriv2.derive(i).pubKey;

          var sharedSecret = PaymentCodes.getSharedSecret(privKey, pubKey);
          expect(sharedSecret.toString("hex")).toEqual(results[i]);
      }
    });
 
    it('Gets bob to alice addresses all right', function() {
      var masterPriv1 = Bitcoin.HDNode.fromSeedHex(aliceSeed);
      var masterPriv2 = Bitcoin.HDNode.fromSeedHex(bobSeed);
      var mPriv1 = masterPriv1.deriveHardened(47).deriveHardened(0).deriveHardened(0);
      var mPriv2 = masterPriv2.deriveHardened(47).deriveHardened(0).deriveHardened(0);
      var code1 = PaymentCodes.formatCode(mPriv1);
      var code2 = PaymentCodes.formatCode(mPriv2);

      var results = bobToAliceAddresses;

      for(var i=0; i<results.length; i++) {
          var address = PaymentCodes.send(mPriv2, code1, i).getAddress();
          expect(address.toString()).toEqual(results[i]);
      }
    });


  });
});
