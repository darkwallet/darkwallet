/*
 * @fileOverview Access to the identity bitcoin keys
 */
'use strict';

define(['model/wallet', 'model/tx', 'bitcoinjs-lib'], function(Wallet, Transaction, Bitcoin) {
  describe('Wallet model', function() {
    
    var identity, wallet, _store, _private, initIfEmpty, origMakeRandom = window.crypto.getRandomValues;
 
    var removeRandomness = function() {
        // remove randomness from the test, this changes how ECKey.makeRandom and crypto browserify rng works
        // fixes issues with older ff in tests
        window.crypto.getRandomValues = function(bytes) { bytes[0] = 255; };
    }
    var restoreRandomness = function() {
      // restore the original getRandom
      window.crypto.getRandomValues = origMakeRandom;
    }

    beforeEach(function() {
      // inhibit initIfEmpty for part of the tests so it doesn't need
      // so much processing   
      initIfEmpty = Wallet.prototype.initIfEmpty;
      Wallet.prototype.initIfEmpty = function() {};

      // Store
      _store = {
        mpk: 'xpub693Ab9Kv7vQjSJ9fZLKAWjqPUEjSyM7LidCCZW8wGosvZKi3Pf2ijiGe1MDTBmQnpXU795HNb4ebuW95tbLNuAzXndALZpRkRaRCbXDhafA',
        pubkeys: {
          "0": {
            "address": "18a2oJD4prCzbdvL5Z8rDKn5Xj7Z7KeTLy",
            "balance": 0,
            "index": [0],
            "label": "pocket",
            "mpk": "xpub6BHYkb4s4V7nq2VaTG2PofTzarLsJGZAgbdmQTUEi35rth35rpzrV19iuBrK1jPjWFBvyoNEc2ib6DAtPuqSMm2MHAuKNRW8NXZgZKn5gir",
            "nOutputs": 0,
            "pubKey": [3, 123, 59, 225, 128, 197, 206, 249, 253, 237, 201, 130, 53, 141, 216, 232, 237, 37, 199, 173, 239, 231, 249, 208, 88, 211, 64, 129, 37, 195, 146, 73, 182],
            "stealth": "vJmtCy3scMRLEDSbFc3xwLXB3Q8fmDLRVaMjC4S2en6KetnAyvUfMT7tvsZPS8xhGGfSmoDGQ8AKRyi7oRYhrhLQJRdvdYLh2z2j5k",
          },
          "2": {
            "address": "1Ga7oYeQGEqzv8eKdFs4TY16EErmLARoT",
            "balance": 0,
            "index": [2],
            "label": "pocket",
            "mpk": "xpub6BHYkb4s4V7ntMRdkpZeZMAgFBAhpayJuKWb6D8guAVYE7ZBUe2fFMwwYNEc3bCk9avs8yW5FxKohiFdCcaWUMpPuf6wESkpzMbFwxscLMk",
            "nOutputs": 0,
            "pubKey": [2, 35, 181, 36, 236, 224, 182, 149, 11, 178, 18, 146, 253, 173, 244, 241, 78, 198, 155, 254, 180, 33, 78, 31, 227, 88, 141, 36, 244, 42, 235, 171, 115],
            "stealth": "vJmtCy3scMRLEDSbFc3xwLXB3Q8fmDLRVaMjC4S2en6KetnAyubqxGCwKCgqXQRzqP3b8nbU8yUnuaazNxAq1ZgmtM6ft6tGWptnkx",
          },
          "0,0": {
            "address": "1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ",
            "balance": 40000,
            "height": 287813,
            "history": [
              ["a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329", 0, 287813, 40000, null, null, null],
              ["64a286efcfa61bd467b721fd3ae4bb566504c328bb7d7762898de966da49dea6", 1, 287583, 3000000, null, null, null],
            ],
            "index": [0, 0],
            "label": "unused",
            "nOutputs": 1,
            "pubKey": [3, 50, 218, 12, 146, 113, 33, 187, 22, 13, 255, 253, 179, 214, 231, 44, 106, 101, 42, 32, 131, 221, 191, 197, 41, 239, 222, 46, 25, 98, 164, 161, 135]
          },
          "2,0": {
            // this is not really the 2,0 address.... it's 1,0 :P
            "address": "1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs",
            "balance": 5000000,
            "height": 269614,
            "history": [
              ["c137710d91140ebaca2ca0f6e1608325c5dbf8ecef13dd50bacccb365a7d155c", 0, 269614, 5000000, null, null, null],
            ],
            "index": [2, 0],
            "label": "unused",
            "nOutputs": 1,
            "pubKey": [2, 41, 140, 192, 149, 205, 83, 114, 37, 106, 0, 164, 123, 46, 88, 38, 11, 252, 215, 149, 236, 188, 150, 165, 89, 64, 40, 218, 206, 26, 13, 49, 27]
          }
        },
        scankeys: [
          {
            "priv": "xprv9xJCM5Y7Zn6TkwLiSZjUKtkREpxRpi7KFcKKja4kMLpU8gDXygR3JP1jUAL591CcKwgKJVNHd68e4HxVFTkuiVHX5zZfPLFkx13c1FRxfmA",
            "pub" : "xpub6BHYkb51Q9ekyRRBYbGUh2h9nrnvEAqAcqEvXxUMugMT1UYgXDjHrBLDKQXAzs8TraQDyM6WhTKeTiMED2XoyY3fW6QU5NR93REbz18tFzs"
          }
        ]
      };
      _private = {
        "privKey": "xprv9v3pBdo2HYrSDp5CTJnA9btevCtxZtPVMQGbm7jKiULwgXNtr7iUBuxAA6o1PJvjXsYzdC71L3xryyq3MLm582uQRbfSQ7jRrkMGaHDtUtw",
        "seed": "af3b84d9c65b165d1fd32048db66b72c",
        "privKeys": {}
      };
      
      identity = {
        store: {
          init: function(key, value) {
            return _store[key] || value;
          },  
          get: function(key) {
            return _store[key];
          },
          set: function(key, value) {
            _store[key] = value;
          },
          getPrivateData: function(password) {
            return _private;
          },
          setPrivateData: function(data, password) {
            _private = data;
          },
          save: function() {
            _store = {};
            for(var i in wallet) {
              if (i == 'pockets')
                _store[i] = wallet.pockets.hdPockets;
              else
                _store[i] = wallet[i];
            }
          }
        }
      };
      wallet = new Wallet(identity.store, identity);
      identity.wallet = wallet;
      identity.tx = new Transaction(identity.store, identity);
      
      Object.keys(wallet.pubKeys).forEach(function(index) {
        var walletAddress = wallet.pubKeys[index];
        if (walletAddress.index.length > 1 && walletAddress.history) {
          wallet.processHistory(walletAddress, walletAddress.history);
        }
      });
    });
    afterEach(function() {
      Wallet.prototype.initIfEmpty = initIfEmpty;
      restoreRandomness();
    });
    
    it('is created properly', function() {
      expect(identity.tx.identity).toBe(identity);
      expect(identity.tx.store).toBe(identity.store);
    });
    
    describe('prepares a transaction', function() {
      var juiceRapNews = '1ESKsNEfjmCZJt3yEYjdE31L1QKqnRVcmn';
      var satoshiForest = '1M72Sfpbz1BPpXFHz9m3CdqATR44Jvaydd';
      var change = {address: '1FiQzyDcmsozGMFUoFMfemNKCMFWqxM72E'};
      
      var commonTransactionChecks = function(tx, tx2) {
        expect(tx2.total).toBe(tx.total);
        expect(tx2.fee).toBe(tx.fee);
        expect(tx2.change).toBe(tx.change);
        expect(tx2.myamount).toBe(tx.myamount);
        expect(tx2.tx.version).toBe(tx.tx.version);
        expect(tx2.tx.ins[0].hash.toString('hex')).toBe(tx.tx.ins[0].hash.toString('hex'));
        expect(tx2.tx.ins[0].index).toBe(tx.tx.ins[0].index);
        expect(tx2.utxo[0].address).toBe(tx.utxo[0].address);
        expect(tx2.utxo[0].value).toBe(tx.utxo[0].value);        
      };

      it('to a normal address', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];
        var tx = identity.tx.prepare(0, recipients, change, 10000);
        
        expect(tx.total).toBe(200000);
        expect(tx.fee).toBe(10000);
        expect(tx.change).toBe(2790000);
        expect(tx.myamount).toBe(3000000);
        expect(tx.tx.version).toBe(1);
        expect(Bitcoin.bufferutils.reverse(tx.tx.ins[0].hash).toString('hex')).toBe('64a286efcfa61bd467b721fd3ae4bb566504c328bb7d7762898de966da49dea6');
        expect(tx.tx.ins[0].index).toBe(1);
        expect(tx.utxo[0].address).toBe('1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ');
        expect(tx.utxo[0].value).toBe(3000000);
        
        // One output for the recipient and the other for the change
        expect(tx.stealth).toBe(false);
        expect(tx.tx.outs.length).toBe(2);
        expect(tx.tx.outs[0].value+tx.tx.outs[1].value).toBe(200000+2790000);
      });
      
      it('to an stealth address', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];
        var tx = identity.tx.prepare(0, recipients, change, 10000);
        
        var recipients = [{amount: 200000, address: 'vJmtCy3scMRLEDSbFc3xwLXB3Q8fmDLRVaMjC4S2en6KetnAyvUfMT7tvsZPS8xhGGfSmoDGQ8AKRyi7oRYhrhLQJRdvdYLh2z2j5k'}];

        removeRandomness();

        var tx2 = identity.tx.prepare(0, recipients, change, 10000);

        restoreRandomness();

        // Stealth addresses have the same values than a normal address
        commonTransactionChecks(tx, tx2);
        
        // One output that contains the stealth data, other for the recipient
        // and other for the change
        expect(tx2.stealth).toBe(true);
        expect(tx2.tx.outs.length).toBe(3);
        expect(tx2.tx.outs[0].value+tx2.tx.outs[1].value+tx2.tx.outs[2].value).toBe(tx.tx.outs[0].value+tx.tx.outs[1].value);
      });
      
      it('to multiple normal addresses', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];
        var tx = identity.tx.prepare(0, recipients, change, 10000);
        
        recipients = [
          {amount: 100000, address: juiceRapNews},
          {amount: 100000, address: satoshiForest}
        ];
        var tx3 = identity.tx.prepare(0, recipients, change, 10000);
        
        commonTransactionChecks(tx, tx3);
        
        // Two outputs for the recipients and one for the change
        expect(tx3.stealth).toBe(false);
        expect(tx3.tx.outs.length).toBe(3);
        expect(tx3.tx.outs[0].value+tx3.tx.outs[1].value+tx3.tx.outs[2].value).toBe(100000+100000+2790000);
      });
      
      it('to multiple stealth addresses', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];

        removeRandomness();
        var tx = identity.tx.prepare(0, recipients, change, 10000);
        
        recipients = [
          {amount: 100000, address: 'vJmtCy3scMRLEDSbFc3xwLXB3Q8fmDLRVaMjC4S2en6KetnAyvUfMT7tvsZPS8xhGGfSmoDGQ8AKRyi7oRYhrhLQJRdvdYLh2z2j5k'},
          {amount: 100000, address: 'vJmtCy3scMRLEDSbFc3xwLXB3Q8fmDLRVaMjC4S2en6KetnAyubqxGCwKCgqXQRzqP3b8nbU8yUnuaazNxAq1ZgmtM6ft6tGWptnkx'}
        ];
        var tx4 = identity.tx.prepare(0, recipients, change, 10000);
        restoreRandomness();
        
        commonTransactionChecks(tx, tx4);
        
        // Two outputs for the stealth data, two for recipients and another for
        // change
        expect(tx4.stealth).toBe(true);
        expect(tx4.tx.outs.length).toBe(5);
        expect(tx4.tx.outs[0].value+tx4.tx.outs[1].value+tx4.tx.outs[2].value+tx4.tx.outs[3].value+tx4.tx.outs[4].value).toBe(0+100000+0+100000+2790000);
      });
      
      it('to multiple addresses', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];
        var tx = identity.tx.prepare(0, recipients, change, 10000);
        
        recipients = [
          {amount: 100000, address: 'vJmtCy3scMRLEDSbFc3xwLXB3Q8fmDLRVaMjC4S2en6KetnAyubqxGCwKCgqXQRzqP3b8nbU8yUnuaazNxAq1ZgmtM6ft6tGWptnkx'},
          {amount: 100000, address: satoshiForest}
        ];
        removeRandomness();
        var tx5 = identity.tx.prepare(0, recipients, change, 10000);
        restoreRandomness();
        
        commonTransactionChecks(tx, tx5);
        
        // One output for stealth data, two for recipients and another for change
        expect(tx5.stealth).toBe(true);
        expect(tx5.tx.outs.length).toBe(4);
        expect(tx5.tx.outs[0].value+tx5.tx.outs[1].value+tx5.tx.outs[2].value+tx5.tx.outs[3].value).toBe(100000+100000+2790000);
      });
      
      it('from a different pocket', function() {
        var recipients = [{amount: 4990000, address: juiceRapNews}];
        var tx6 = identity.tx.prepare(1, recipients, change, 10000);
        
        expect(tx6.total).toBe(4990000);
        expect(tx6.fee).toBe(10000);
        expect(tx6.change).toBe(0);
        expect(tx6.myamount).toBe(5000000);
        expect(tx6.tx.version).toBe(1);
        expect(Bitcoin.bufferutils.reverse(tx6.tx.ins[0].hash).toString('hex')).toBe('c137710d91140ebaca2ca0f6e1608325c5dbf8ecef13dd50bacccb365a7d155c');
        expect(tx6.tx.ins[0].index).toBe(0);
        expect(tx6.utxo[0].address).toBe('1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs');
        expect(tx6.utxo[0].value).toBe(5000000);
        
        // Only one output because we don't have change in this transaction
        expect(tx6.stealth).toBe(false);
        expect(tx6.tx.outs.length).toBe(1);
        expect(tx6.tx.outs[0].value).toBe(4990000);
        
        expect(function() {
          identity.tx.prepare('not an index', recipients, change, 10000)
        }).toThrow();
      });
      
      it('with a different fee', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];
        var tx7 = identity.tx.prepare(0, recipients, change, 20000);
        
        expect(tx7.fee).toBe(20000);
        expect(tx7.change).toBe(3000000 - 200000 - 20000);
        expect(tx7.tx.outs[1].value+tx7.tx.outs[0].value).toBe(3000000 - 20000);
      });
    });
    
    
    it('processes an output for an external source');
    
    it('checks if transaction involves given addres');
    
    it('processes incoming transaction')
    
    it('processes history report from obelisk');
    
    it('gets the stealth scanning ECKey');
    
    it('processes stealth array from obelisk');
  });
});
