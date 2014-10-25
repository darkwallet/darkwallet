'use strict';

define(['testUtils', 'bitcoinjs-lib'], function (testUtils, Bitcoin) {

  describe('Multisig Utils', function() {

    var MultisigFund;

    var txIn = "01000000011abab476564f7153d6d5c01f69719d083a968e96cfef75f1eb426ad4dfaad8c6010000006a47304402206f0f4cd73269ac852442cce8462bcacae8af6639d7f2b4b0a1f7e10d8d3c9fe402200b7a38ba64e6e62a2596cc21970292c1f5a04886d077ff83dc48350cd10435690121037c54f475e4116d24266e23de543b5f75f7bbf29ff4d3d4cd22d3a7c7d80c61edffffffff01905f01000000000017a9141b59804ad7bf8330d71d8badfec4edd60cb92dc58700000000";
    var txOut = "01000000010eb1f05a823ae9b35955f7549746d307352769758a355015b57fc984f0e6fbb10000000000ffffffff0180380100000000001976a914e0731cac0341d0546d2e754379d1e74370e5d8bf88ac00000000";
    var txOutPartial = '01000000010eb1f05a823ae9b35955f7549746d307352769758a355015b57fc984f0e6fbb1000000006c004c6952210281a3d72a88ec66b04781077359cb04449603909ebe63e6df41de6be55638dfda21023959052c9bb9d66aa52a7e1a34e04ddc0e0833d9c06a57f715366ed097fc8ddf2103b5be88abd12c0273fc284c8cb46ae5cb0750b27a3463cbd0e75d6ba41436e01453aeffffffff0180380100000000001976a914e0731cac0341d0546d2e754379d1e74370e5d8bf88ac00000000';
    var txForeign = "01000000024b29c7abd143582985ab746905cd79731fbe953b93413dcc486f0409b9ce62890000000000ffffffffc7052b97e8d78df0ec6cc17f96e645360835c9a1105963ef726fd879cc8271210000000000ffffffff02c09ee605000000001976a914f587db9cc12fb50bd877475d73a62a8059e7054388acc09ee605000000001976a9141db621e7447d279d4267f0517e58330d0f89e53d88ac00000000";
    var txSigned = "01000000010eb1f05a823ae9b35955f7549746d307352769758a355015b57fc984f0e6fbb100000000b400473044022002e4445fd146aad250a6c43d73a4bb63b326671df9966946a9f41e97e95be38602205ec5ecc94b137695b6426aadcc72f6b83a54dc5e0419ba57dffb3642bbf85bfc014c6952210281a3d72a88ec66b04781077359cb04449603909ebe63e6df41de6be55638dfda21023959052c9bb9d66aa52a7e1a34e04ddc0e0833d9c06a57f715366ed097fc8ddf2103b5be88abd12c0273fc284c8cb46ae5cb0750b27a3463cbd0e75d6ba41436e01453aeffffffff0180380100000000001976a914e0731cac0341d0546d2e754379d1e74370e5d8bf88ac00000000";
    var txSigned2 = "01000000010eb1f05a823ae9b35955f7549746d307352769758a355015b57fc984f0e6fbb100000000b4004730440220287b25690f28b5b3d6bf4326981ffe7c9ac15c9174e4652efe7ef8748e4660710220177abaf19024dd43f7a186e47437115dbe4a119549d10185d4bf81654b99dbc8014c6952210281a3d72a88ec66b04781077359cb04449603909ebe63e6df41de6be55638dfda21023959052c9bb9d66aa52a7e1a34e04ddc0e0833d9c06a57f715366ed097fc8ddf2103b5be88abd12c0273fc284c8cb46ae5cb0750b27a3463cbd0e75d6ba41436e01453aeffffffff0180380100000000001976a914e0731cac0341d0546d2e754379d1e74370e5d8bf88ac00000000";

    var pubKey1 = Bitcoin.Buffer("0281a3d72a88ec66b04781077359cb04449603909ebe63e6df41de6be55638dfda", "hex");
    var pubKey2 = Bitcoin.Buffer("03b5be88abd12c0273fc284c8cb46ae5cb0750b27a3463cbd0e75d6ba41436e014", "hex");
    var pubKey3 = Bitcoin.Buffer("023959052c9bb9d66aa52a7e1a34e04ddc0e0833d9c06a57f715366ed097fc8ddf", "hex");

    var multisig = {
      name: "test multisig",
      address: "34BdPNW81AU64JhLVyWiaEfgAPQUP17VTV",
      script: "52210281a3d72a88ec66b04781077359cb04449603909ebe63e6df41de6be55638dfda21023959052c9bb9d66aa52a7e1a34e04ddc0e0833d9c06a57f715366ed097fc8ddf2103b5be88abd12c0273fc284c8cb46ae5cb0750b27a3463cbd0e75d6ba41436e01453ae",
      m: 2,
      pubKeys: [
        [2, 129, 163, 215, 42, 136, 236, 102, 176, 71, 129, 7, 115, 89, 203, 4, 68, 150, 3, 144, 158, 190, 99, 230, 223, 65, 222, 107, 229, 86, 56, 223, 218],
        [2, 57, 89, 5, 44, 155, 185, 214, 106, 165, 42, 126, 26, 52, 224, 77, 220, 14, 8, 51, 217, 192, 106, 87, 247, 21, 54, 110, 208, 151, 252, 141, 223],
        [3, 181, 190, 136, 171, 209, 44, 2, 115, 252, 40, 76, 140, 180, 106, 229, 203, 7, 80, 178, 122, 52, 99, 203, 208, 231, 93, 107, 164, 20, 54, 224, 20]
      ]
    };

    beforeEach(function(done) {
      var identityTasks = {
                multisig: [{pending: [{address: "34BdPNW81AU64JhLVyWiaEfgAPQUP17VTV", signatures: {}}], tx: txIn}]  };
;
      testUtils.stub('darkwallet', {
        service: { multisigTrack: { sign: function() {} } },
        getIdentity: function() {
          return {
            name: 'test identity',
            settings: {
              currency: 'BTC',
              fiatCurrency: 'EUR'
            },
            tasks: {
              getTasks: function(section) {
                return identityTasks[section];
              },
              addTask: function(section, task) { identityTasks[section].push(task); },
              tasks: identityTasks
            },
            tx: {
              forAddress: function(walletAddress, tx) { if (tx.ins.length == 1 && walletAddress.name === 'fund') {return [{index: 0, outpoint: {hash: new Bitcoin.Buffer('dead', 'hex'), index: 0}}]} return []; }
            },
            wallet: {
              network: 'bitcoin',
              getWalletAddress: function(address) {
                  if (address === "1GLHNLABipUJZ7tN2LDu85zxpxVVmswbhB") return {name: 'testAddress'};
                  if (address === "34BdPNW81AU64JhLVyWiaEfgAPQUP17VTV") return {name: 'fund'};
              },
              getPrivateKey: function(seq, password, cb) {
                  cb(Bitcoin.ECKey.fromWIF("Kwi6e7qyemChBmPm1ySD8VR99eGNfE74iQDp8Q5PFKri6mgoUkFf"));
              }
            },
            contacts: {
              findByPubKey: function(pubKeyBytes) {
                  if (pubKeyBytes === multisig.pubKeys[1]) {
                      return {data: {name: 'test contact', hash: 'dead'}, findIdentityKey: function() {return "idkey";}};
                  }
              }
            }
          };
        }
      });
      testUtils.loadWithCurrentStubs('dwutil/multisig', function(loadedModule) {
        MultisigFund = loadedModule;
        done();
      });
    });

    afterEach(function() {
      testUtils.reset();
    });

    it('creates a multisig', function() {
      var fund = new MultisigFund(multisig);

      // detects participants
      expect(fund.participants[0].pubKey).toEqual(multisig.pubKeys[0]);
      expect(fund.participants[1].pubKey).toEqual(multisig.pubKeys[1]);
      expect(fund.participants[2].pubKey).toEqual(multisig.pubKeys[2]);
      expect(fund.participants[0].type).toEqual("me");
      expect(fund.participants[1].type).toEqual("contact");
      expect(fund.participants[2].type).toBeUndefined();

      // detects me
      expect(fund.me).toEqual([0]);

      // detects tasks
      expect(fund.tasks.length).toEqual(1);
      expect(fund.tasks[0].task.tx).toEqual(txIn);
    });

    xit('detects tasks', function() {
    });

    it('finds a fund task', function() {
      var fund = new MultisigFund(multisig);
      var spend = fund.findFundTask(fund.tasks[0].task);
      expect(spend.task.tx).toBe(txIn);
    });

    xit('organizes signatures', function() {
    });

    xit('finishes a transaction', function() {
    });

    xit('imports an input signature', function() {
    });

    it('imports a signature', function() {
      var fund = new MultisigFund(multisig);
      var spend = fund.importTransaction(txOut);
      var added = fund.importSignature("30440220287b25690f28b5b3d6bf4326981ffe7c9ac15c9174e4652efe7ef8748e4660710220177abaf19024dd43f7a186e47437115dbe4a119549d10185d4bf81654b99dbc8", spend);
      expect(added).toBe(true);

    });

    it('imports a bad signature', function() {
      var fund = new MultisigFund(multisig);
      var spend = fund.importTransaction(txOut);
      var added = fund.importSignature("30440220287b25690f281111111f4326981ffe7c9ac15c9174e4652efe7ef8748e4660710220177abaf19024dd43f7a186e47437115dbe4a119549d10185d4bf81654b99dbc8", spend);
      expect(added).toBe(false);

    });


    it('imports a badly serialized signature', function() {
      var fund = new MultisigFund(multisig);
      var spend = fund.importTransaction(txOut);
      expect(function() {
          fund.importSignature("zzz");
      }).toThrow();
    });


    it('gets a spend', function() {
      var fund = new MultisigFund(multisig);
      var spend = fund.getSpend("b1fbe6f084c97fb51550358a7569273507d3469754f75559b3e93a825af0b10e");
      expect(spend.task.tx).toBe(txIn);
    });

    it('imports a malformed transaction', function() {
      var fund = new MultisigFund(multisig);
      expect(function() {
        fund.importTransaction("xxx");
      }).toThrow();
    });

    it('imports a transaction for another multisig', function() {
      var fund = new MultisigFund(multisig);
      expect(function() {
        fund.importTransaction(txForeign);
      }).toThrow();
    });

    it('imports a transaction', function() {
      var fund = new MultisigFund(multisig);
      var spend = fund.importTransaction(txOut);

      expect(fund.tasks.length).toEqual(2);
      expect(fund.tasks[1].task.tx).toEqual(txOut);
      expect(spend.task.tx).toEqual(txOut);
      expect(spend.task.pending.length).toEqual(1);
      expect(spend.tx.ins.length).toEqual(1);
      expect(spend.tx.outs.length).toEqual(1);
    });

    it('imports a signed transaction', function() {
      var fund = new MultisigFund(multisig);
      var spend = fund.importTransaction(txSigned);

      expect(fund.tasks.length).toEqual(2);
      expect(fund.tasks[1].task.tx).toEqual(txSigned);
      expect(spend.task.tx).toEqual(txSigned);
      expect(spend.task.pending.length).toEqual(1);
      expect(spend.task.pending[0].signatures[0]).toBe('3044022002e4445fd146aad250a6c43d73a4bb63b326671df9966946a9f41e97e95be38602205ec5ecc94b137695b6426aadcc72f6b83a54dc5e0419ba57dffb3642bbf85bfc');
      expect(spend.tx.ins.length).toEqual(1);
      expect(spend.tx.outs.length).toEqual(1);

      // import second transaction
      spend = fund.importTransaction(txSigned2);
      expect(fund.tasks.length).toEqual(2);
      expect(spend.task.pending.length).toEqual(1);
      expect(spend.task.pending[0].signatures[0]).toBe('3044022002e4445fd146aad250a6c43d73a4bb63b326671df9966946a9f41e97e95be38602205ec5ecc94b137695b6426aadcc72f6b83a54dc5e0419ba57dffb3642bbf85bfc');
      expect(spend.task.pending[0].signatures[2]).toBe('30440220287b25690f28b5b3d6bf4326981ffe7c9ac15c9174e4652efe7ef8748e4660710220177abaf19024dd43f7a186e47437115dbe4a119549d10185d4bf81654b99dbc8');
      expect(spend.tx.ins.length).toEqual(1);
      expect(spend.tx.outs.length).toEqual(1);
    });

    it('imports a transaction twice', function() {
      var fund = new MultisigFund(multisig);
      var spend = fund.importTransaction(txOut);
      spend = fund.importTransaction(txOut);

      expect(fund.tasks.length).toEqual(2);
      expect(fund.tasks[1].task.tx).toEqual(txOutPartial);
      expect(spend.task.tx).toEqual(txOutPartial);
      expect(spend.task.pending.length).toEqual(1);
      expect(spend.tx.ins.length).toEqual(1);
      expect(spend.tx.outs.length).toEqual(1);
    });

    it('gets valid inputs', function() {
      var fund = new MultisigFund(multisig);
      var spend = fund.importTransaction(txOut);
      var inputs = fund.getValidInputs(spend.tx);

      expect(inputs.length).toBe(1);
      expect(inputs[0].index).toEqual(0);
      expect(inputs[0].outpoint.index).toEqual(0);
      expect(inputs[0].outpoint.hash.toString('hex')).toEqual('dead');
    });

    it('signs a transaction', function() {
      var fund = new MultisigFund(multisig);
      var spend = fund.importTransaction(txOut);
      var inputs = fund.getValidInputs(spend.tx);
      var signed = fund.signTransaction('pass', spend, inputs);

      expect(signed).toBe(true);
      expect(Object.keys(spend.task.pending[0].signatures).length).toBe(1);
      expect(spend.task.pending[0].signatures[0]).toBe("3044022002e4445fd146aad250a6c43d73a4bb63b326671df9966946a9f41e97e95be38602205ec5ecc94b137695b6426aadcc72f6b83a54dc5e0419ba57dffb3642bbf85bfc");
    });

    it('signs a transaction with a foreign key', function() {
      var fund = new MultisigFund(multisig);
      var spend = fund.importTransaction(txOut);
      var signed = fund.signTxForeign("L2xRYhcVkpw2S7tZVpeHiChxKrMNDTyjHW4vibPBUBHL3zBDLmG8", spend);

      expect(signed).toBe(true);
      expect(Object.keys(spend.task.pending[0].signatures).length).toBe(1);
      expect(spend.task.pending[0].signatures[2]).toBe("30440220287b25690f28b5b3d6bf4326981ffe7c9ac15c9174e4652efe7ef8748e4660710220177abaf19024dd43f7a186e47437115dbe4a119549d10185d4bf81654b99dbc8");
    });

  });

});
