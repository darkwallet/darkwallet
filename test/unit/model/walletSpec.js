/*
 * @fileOverview Access to the identity bitcoin keys
 */
'use strict';

define(['model/wallet', 'bitcoinjs-lib'], function(Wallet, Bitcoin) {
  describe('Wallet model', function() {
    
    var identity, wallet, _store, _private;
    
    beforeEach(function() {
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
      
      Object.keys(wallet.pubKeys).forEach(function(index) {
        var walletAddress = wallet.pubKeys[index];
        if (walletAddress.index.length > 1 && walletAddress.history) {
          wallet.processHistory(walletAddress, walletAddress.history);
        }
      });
    });
    
    it('creates an empty wallet correctly', function() {
      _store = {mpk: _store.mpk};
      var myWallet = new Wallet(identity.store, identity);
      myWallet.initIfEmpty();
      expect(Object.keys(myWallet.pubKeys).length).toBe(6);
      expect(Object.keys(myWallet.pubKeys)).toEqual(['0,0', '0,1', '1,0', '2,0', '2,1', '3,0']);
    });

    it('is created properly', function() {
      expect(wallet.identity).toBe(identity);
      expect(wallet.store).toBe(identity.store);
      expect(wallet.is_cold).toBeFalsy();
      expect(wallet.fee).toBe(10000); // 0.1 mBTC
      expect(wallet.pubKeys[0]).toBeDefined();
      expect(wallet.pubKeys['0,0']).toBeDefined();
      expect(wallet.scanKeys[0].priv).toBeDefined();
      expect(wallet.scanKeys[0].pub).toBeDefined();
      expect(wallet.pockets.hdPockets).toEqual([{name: 'spending'}, {name: 'savings'}]);
      expect(wallet.pockets.pocketWallets).toEqual({0: {addresses: ['1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ'], balance: 0}, 1: {addresses: ['1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs' ], balance: 0}});
      expect(wallet.mpk).toBe('xpub693Ab9Kv7vQjSJ9fZLKAWjqPUEjSyM7LidCCZW8wGosvZKi3Pf2ijiGe1MDTBmQnpXU795HNb4ebuW95tbLNuAzXndALZpRkRaRCbXDhafA');
      expect(wallet.wallet).toBeDefined();
      expect(wallet.multisig).toBeDefined();

      _store = {};
      _private = {};
      wallet = new Wallet(identity.store, identity);
      expect(wallet.identity).toBe(identity);
      expect(wallet.store).toBe(identity.store);
      expect(wallet.is_cold).toBeFalsy();
      expect(wallet.fee).toBe(10000); // 0.1 mBTC
      expect(wallet.pubKeys).toEqual({});
      expect(wallet.scanKeys).toEqual([]);
      expect(wallet.pockets.hdPockets).toEqual([{name: 'spending'}, {name: 'savings'}]);
      expect(wallet.pockets.pocketWallets).toEqual({0: {addresses: [], balance: 0}, 1: {addresses: [], balance: 0}});
      expect(wallet.mpk).toBeFalsy();
      expect(wallet.wallet).toBeDefined();
      expect(wallet.multisig).toBeDefined();
    });
    
    it('gets balance', function() {
      var balance = wallet.getBalance();
      expect(balance.confirmed).toBe(8040000);
      
      expect(wallet.getBalance('0')).toEqual({ confirmed : 3040000, unconfirmed : 0 });
      expect(wallet.getBalance('2')).toEqual({ confirmed : 5000000, unconfirmed : 0 });
    });
    
    it('creates a pocket', function() {
      var pockets = [{name: 'spending'}, {name: 'savings'}, {name: 'Spendings'}];
      wallet.pockets.createPocket('Spendings');
      expect(wallet.pockets.hdPockets).toEqual(pockets);
      expect(_store.pockets).toEqual(pockets);
      expect(Object.keys(wallet.pockets.pocketWallets).length).toBe(3);

      // Do not allow duplicates
      expect(function() {
        wallet.pockets.createPocket('Spendings');
      }).toThrow();
    });
    
    it('initializes a pocket', function() {
      wallet.pockets.initPocketWallet(100);
      expect(wallet.pockets.pocketWallets[100]).toEqual({addresses: [], balance: 0});
    });
    
    it('gets a pocket', function() {
      wallet.pockets.hdPockets = [{name: 'spending'}, {name: 'savings'}, {name: 'Spendings'}];
      expect(wallet.pockets.getPocket('savings')).toBe(wallet.pockets.hdPockets[1]);
    });
    
    it('deletes a pocket', function() {
      var pockets = [{name: 'spending'}, {name: 'savings'}];
      expect(function() {
        wallet.pockets.deletePocket('incorrect');
      }).toThrow();
      
      wallet.pockets.deletePocket('spending');
      expect(wallet.pockets.hdPockets).toEqual([null, {name: 'savings'}]);
      expect(_store.pockets).toEqual([null, {name: 'savings'}]);
      expect(Object.keys(wallet.pockets.pocketWallets).length).toBe(2);
    });
    
    it('get pocket index for an address', function() {
      expect(wallet.pockets.getAddressPocketId({index: [0]})).toBe(0);
      expect(wallet.pockets.getAddressPocketId({index: [1]})).toBe(0);
      expect(wallet.pockets.getAddressPocketId({index: [2]})).toBe(1);
      expect(wallet.pockets.getAddressPocketId({index: [3]})).toBe(1);
      
      expect(wallet.pockets.getAddressPocketId({index: [0], type: 'stealth'})).toBe(0);
      expect(wallet.pockets.getAddressPocketId({index: [1], type: 'stealth'})).toBe(0);
      expect(wallet.pockets.getAddressPocketId({index: [2], type: 'stealth'})).toBe(1);
      expect(wallet.pockets.getAddressPocketId({index: [3], type: 'stealth'})).toBe(1);
      
      expect(wallet.pockets.getAddressPocketId({index: [0], type: 'multisig'})).toBe(0);
      expect(wallet.pockets.getAddressPocketId({index: ['hi'], type: 'multisig'})).toBe('hi');
      expect(wallet.pockets.getAddressPocketId({index: ['32...'], type: 'multisig'})).toBe('32...');
      expect(wallet.pockets.getAddressPocketId({index: [3], type: 'multisig'})).toBe(3);
    });
    
    it('adds an address to a pocket', function() {
      _store = {};
      _private = {};
      wallet = new Wallet(identity.store, identity);
      
      wallet.pockets.addToPocket({index: [0,1], address: '10...'});
      wallet.pockets.addToPocket({index: [0,2], address: '12...'});
      wallet.pockets.addToPocket({index: [1,1], address: '14...'});
      wallet.pockets.addToPocket({index: [2,1], address: '16...'});
      expect(wallet.pockets.pocketWallets).toEqual({
        0: {addresses: ['10...', '12...', '14...'], balance: 0},
        1: {addresses: ['16...'], balance: 0}
      });
    });
    
    it('adds an addres to itself', function() {
      _store = {};
      _private = {};
      wallet = new Wallet(identity.store, identity);
      
      var walletAddress0 = {index: [0,1], address: '10...'};
      var walletAddress1 = {index: [0,2], address: '12...'};
      var walletAddress2 = {index: [1,1], address: '14...'};
      var walletAddress3 = {index: [2,1], address: '16...'};
      
      wallet.addToWallet(walletAddress0);
      wallet.addToWallet(walletAddress1);
      wallet.addToWallet(walletAddress2);
      wallet.addToWallet(walletAddress3);
      
      expect(wallet.wallet.addresses).toEqual(['10...', '12...', '14...', '16...']);
      expect(wallet.pubKeys).toEqual({
        "0,1": walletAddress0,
        "0,2": walletAddress1,
        "1,1": walletAddress2,
        "2,1": walletAddress3
      });
      expect(wallet.pockets.pocketWallets).toEqual({
        0: {addresses: ['10...', '12...', '14...'], balance: 0},
        1: {addresses: ['16...'], balance: 0}
      });
      expect(_store.wallet.addresses).toEqual(['10...', '12...', '14...', '16...']);
    });
    
    it('loads public keys', function() { // private
      expect(wallet.wallet.addresses).toEqual([ '18a2oJD4prCzbdvL5Z8rDKn5Xj7Z7KeTLy', '1Ga7oYeQGEqzv8eKdFs4TY16EErmLARoT', '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ', '1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs' ]);
      expect(wallet.pockets.pocketWallets[0].addresses).toEqual(['1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ']);
      expect(wallet.pockets.pocketWallets[1].addresses).toEqual(['1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs']);
    });
    
    it('gets private key', function() {
      wallet.getPrivateKey([0,1], 'p4ssw0rd', function(priv) {
        expect(priv.priv[0]).toEqual(55140896);
        expect(priv.priv[4]).toEqual(50599429);
        expect(priv.priv[10]).toEqual(0);
        expect(priv.priv['t']).toEqual(10);
        expect(priv.priv['s']).toEqual(0);
        expect(priv.compressed).toBe(true);
        expect(priv.version).toBe(0);
      });
    });

    it('gets a pocket private key', function() {
      var priv = wallet.getPocketPrivate([0], 'p4ssw0rd');

      expect(priv).toBe("xprv9xJCM5XyE7ZVcYR7MEVPSXXG2pWNtoqKKNiAc54d9hYt1thwKHgbwCqF3tr3kwNVQzyRND5PojJHaDTT62iXfU67m91ZUdYzMqm7uKSjb6J");
    });

    it('gets a stealth private key', function() {
      var masterKey = Bitcoin.HDWallet.fromBase58(wallet.getPocketPrivate(0, 'p4ssw0rd'));

      var ephemKey = [2, 41, 140, 192, 149, 205, 83, 114, 37, 106, 0, 164, 123, 46, 88, 38, 11, 252, 215, 149, 236, 188, 150, 165, 89, 64, 40, 218, 206, 26, 13, 49, 27];
      var stealth = wallet.deriveStealthPrivateKey([0, 's'].concat(ephemKey), masterKey, {privKeys: {}});
      expect(stealth.getAddress().toString()).toEqual("12qKy5XyAaRvqzgVnECDmAXjjY1ySPC7At");
    });
 
    it('stores private key', function() {
      _store = {};
      _private = {privKeys: {}};
      wallet = new Wallet(identity.store, identity);
      
      var key = {
        toBytes: function() { return 'mock'; }
      };
      wallet.storePrivateKey([0,1], 'p4ssw0rd', key);
      expect(_private.privKeys).toEqual({'0,1': 'mock'});
    });
    
    it('stores address', function() {
      var key = [3, 230, 108, 78, 135, 206, 92, 61, 135, 181, 251, 31, 231, 198, 73, 21, 65, 11, 154, 52, 37, 14, 154, 215, 149, 56, 212, 154, 91, 187, 111, 254, 70];
      
      // unused
      var walletAddress = wallet.storePublicKey([0,6], key, {type: 'foo', foo: 'bar'});
      expect(walletAddress.index).toEqual([0,6]);
      expect(walletAddress.label).toEqual('unused');
      expect(walletAddress.balance).toEqual(0);
      expect(walletAddress.nOutputs).toEqual(0);
      expect(walletAddress.pubKey).toEqual(key);
      expect(walletAddress.address).toEqual('16446XF652ofnwTDEMuEMGu1aNHkg6GrXH');
      expect(walletAddress.stealth).toBeUndefined();
      expect(walletAddress.type).toBe('foo');
      expect(walletAddress.foo).toBe('bar');
      expect(wallet.wallet.addresses).toContain('16446XF652ofnwTDEMuEMGu1aNHkg6GrXH');
      
      // change
      walletAddress = wallet.storePublicKey([1,6], key);
      expect(walletAddress.label).toEqual('change');
      expect(walletAddress.stealth).toBeUndefined();
      
      // pocket
      walletAddress = wallet.storePublicKey([0], key);
      expect(walletAddress.label).toEqual('pocket');
      expect(walletAddress.stealth).toBe('vJmyLmVSTiTQYdMnXGe1SasS5sbkUMEqNqbkCFdFWWB1NxvyxGN4Ku9D2mxy9VA9KGXuFNpz8idDrtpAGPeu5qzWbgHmrmdDAKnYZH');
    });
    
    it('gets address', function() {
      // Already stored
      expect(wallet.getAddress([0,1]).address).toBe('1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs');
      // Derive and store
      expect(wallet.getAddress([5,1]).address).toBe('1LMCt3RZ2fX3Tv4aSUdJxpjZ2AL72Fw7NK');
      expect(wallet.wallet.addresses).toContain('1LMCt3RZ2fX3Tv4aSUdJxpjZ2AL72Fw7NK');
    });

    it('gets a free address', function() {
      // Already stored
      expect(wallet.getFreeAddress(0).address).toBe('1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs');
      // Derive and store
      expect(wallet.getFreeAddress(1).address).toBe('1JcmPQq3375pgukzqefdqQdpR4M9ThuR7x');
      expect(wallet.wallet.addresses).toContain('1JcmPQq3375pgukzqefdqQdpR4M9ThuR7x');
    });

    it('gets a change address', function() {
      // Already stored
      expect(wallet.getChangeAddress(0).address).toBe('1JcmPQq3375pgukzqefdqQdpR4M9ThuR7x');
      // Derive and store
      var changeAddress = wallet.getChangeAddress(1);
      expect(changeAddress.address).toBe('1JTQfz3j4S2VmkgNGcV4BwGf5cLYYH7TgV');
      expect(changeAddress.index).toEqual([3,0]);
      expect(wallet.wallet.addresses).toContain('1JTQfz3j4S2VmkgNGcV4BwGf5cLYYH7TgV');
    });
    
    it('gets wallet address', function() {
      var walletAddress = wallet.getWalletAddress('1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs');
      expect(walletAddress.address).toBe('1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs');
      
      walletAddress = wallet.getWalletAddress('not there');
      expect(walletAddress).toBeUndefined();
    });
    
    it('sets default fee', function() {
      expect(wallet.fee).toBe(10000);
      wallet.setDefaultFee(20000);
      expect(wallet.fee).toBe(20000);
      expect(_store.fee).toBe(20000);
    });
   
    it('get pockets wallet', function() {
      var tmpWallet = wallet.pockets.getPocketWallet(0);
      expect(tmpWallet.addresses).toEqual(['1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ']);
      expect(Object.keys(tmpWallet.outputs).length).toBe(2);
      expect(tmpWallet.outputs["a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329:0"].value).toBe(40000);
      expect(tmpWallet.outputs["64a286efcfa61bd467b721fd3ae4bb566504c328bb7d7762898de966da49dea6:1"].value).toBe(3000000);
      
      tmpWallet = wallet.pockets.getPocketWallet(1);
      expect(tmpWallet.addresses).toEqual(['1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs']);
      expect(Object.keys(tmpWallet.outputs).length).toBe(1);
      expect(tmpWallet.outputs["c137710d91140ebaca2ca0f6e1608325c5dbf8ecef13dd50bacccb365a7d155c:0"].value).toBe(5000000);
    });
    
    it('gets utxo to pay', function() {
      
      var history00 = {
        receive: 'a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329:0',
        value: 40000, 
        address: '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ',
        height: 287813
      };
      var history01 = {
        receive: '64a286efcfa61bd467b721fd3ae4bb566504c328bb7d7762898de966da49dea6:1',
        value : 3000000,
        address : '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ',
        height: 287583
      };
      var history20 = {
        receive: 'c137710d91140ebaca2ca0f6e1608325c5dbf8ecef13dd50bacccb365a7d155c:0',
        value: 5000000,
        address: '1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs',
        height: 269614
      };
      
      expect(wallet.getUtxoToPay(9000, 0)).toEqual([history00]);
      expect(wallet.getUtxoToPay(400000, 0)).toEqual([history01]);
      expect(wallet.getUtxoToPay(3040000, 0)).toEqual([history00, history01]);
      
      
      expect(wallet.getUtxoToPay(9000, 1)).toEqual([history20]);
      
      // Throws if there isn't enought money in the wallet
      expect(function() {
        wallet.getUtxoToPay(5000001, 2);
      }).toThrow();
      expect(function() {
        wallet.getUtxoToPay(999999999999, 'all');
      }).toThrow();
      
      // Throws if pocket is invalid
      expect(function() {
        wallet.getUtxoToPay(Number.NaN, 'all');
      }).toThrow();
      
      // Throws if pocket doesn't exist or is invalid
      expect(function() {
        wallet.getUtxoToPay(10, 2);
      }).toThrow();
      expect(function() {
        wallet.getUtxoToPay(10, null);
      }).toThrow();
      expect(function() {
        wallet.getUtxoToPay(10, 'bla');
      }).toThrow();
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
        expect(tx2.tx.ins[0].outpoint.hash).toBe(tx.tx.ins[0].outpoint.hash);
        expect(tx2.tx.ins[0].outpoint.index).toBe(tx.tx.ins[0].outpoint.index);
        expect(tx2.utxo[0].address).toBe(tx.utxo[0].address);
        expect(tx2.utxo[0].value).toBe(tx.utxo[0].value);        
      };

      it('to a normal address', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];
        var tx = wallet.prepareTx(0, recipients, change, 10000);
        
        expect(tx.total).toBe(200000);
        expect(tx.fee).toBe(10000);
        expect(tx.change).toBe(2790000);
        expect(tx.myamount).toBe(3000000);
        expect(tx.tx.version).toBe(1);
        expect(tx.tx.ins[0].outpoint.hash).toBe('64a286efcfa61bd467b721fd3ae4bb566504c328bb7d7762898de966da49dea6');
        expect(tx.tx.ins[0].outpoint.index).toBe('1');
        expect(tx.utxo[0].address).toBe('1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ');
        expect(tx.utxo[0].value).toBe(3000000);
        
        // One output for the recipient and the other for the change
        expect(tx.stealth).toBe(false);
        expect(tx.tx.outs.length).toBe(2);
        expect(tx.tx.outs[0].value).toBe(200000);
        expect(tx.tx.outs[1].value).toBe(2790000);
      });
      
      it('to an stealth address', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];
        var tx = wallet.prepareTx(0, recipients, change, 10000);
        
        var recipients = [{amount: 200000, address: 'vJmtCy3scMRLEDSbFc3xwLXB3Q8fmDLRVaMjC4S2en6KetnAyvUfMT7tvsZPS8xhGGfSmoDGQ8AKRyi7oRYhrhLQJRdvdYLh2z2j5k'}];
        var tx2 = wallet.prepareTx(0, recipients, change, 10000);

        // Stealth addresses have the same values than a normal address
        commonTransactionChecks(tx, tx2);
        
        // One output that contains the stealth data, other for the recipient
        // and other for the change
        expect(tx2.stealth).toBe(true);
        expect(tx2.tx.outs.length).toBe(3);
        expect(tx2.tx.outs[0].value).toBe(0);
        expect(tx2.tx.outs[1].value).toBe(tx.tx.outs[0].value);
        expect(tx2.tx.outs[2].value).toBe(tx.tx.outs[1].value);
      });
      
      it('to multiple normal addresses', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];
        var tx = wallet.prepareTx(0, recipients, change, 10000);
        
        recipients = [
          {amount: 100000, address: juiceRapNews},
          {amount: 100000, address: satoshiForest}
        ];
        var tx3 = wallet.prepareTx(0, recipients, change, 10000);
        
        commonTransactionChecks(tx, tx3);
        
        // Two outputs for the recipients and one for the change
        expect(tx3.stealth).toBe(false);
        expect(tx3.tx.outs.length).toBe(3);
        expect(tx3.tx.outs[0].value).toBe(100000);
        expect(tx3.tx.outs[1].value).toBe(100000);
        expect(tx3.tx.outs[2].value).toBe(2790000);
      });
      
      it('to multiple stealth addresses', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];
        var tx = wallet.prepareTx(0, recipients, change, 10000);
        
        recipients = [
          {amount: 100000, address: 'vJmtCy3scMRLEDSbFc3xwLXB3Q8fmDLRVaMjC4S2en6KetnAyvUfMT7tvsZPS8xhGGfSmoDGQ8AKRyi7oRYhrhLQJRdvdYLh2z2j5k'},
          {amount: 100000, address: 'vJmtCy3scMRLEDSbFc3xwLXB3Q8fmDLRVaMjC4S2en6KetnAyubqxGCwKCgqXQRzqP3b8nbU8yUnuaazNxAq1ZgmtM6ft6tGWptnkx'}
        ];
        var tx4 = wallet.prepareTx(0, recipients, change, 10000);
        
        commonTransactionChecks(tx, tx4);
        
        // Two outputs for the stealth data, two for recipients and another for
        // change
        expect(tx4.stealth).toBe(true);
        expect(tx4.tx.outs.length).toBe(5);
        expect(tx4.tx.outs[0].value).toBe(0);
        expect(tx4.tx.outs[1].value).toBe(100000);
        expect(tx4.tx.outs[2].value).toBe(0);
        expect(tx4.tx.outs[3].value).toBe(100000);
        expect(tx4.tx.outs[4].value).toBe(2790000);
      });
      
      it('to multiple addresses', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];
        var tx = wallet.prepareTx(0, recipients, change, 10000);
        
        recipients = [
          {amount: 100000, address: 'vJmtCy3scMRLEDSbFc3xwLXB3Q8fmDLRVaMjC4S2en6KetnAyubqxGCwKCgqXQRzqP3b8nbU8yUnuaazNxAq1ZgmtM6ft6tGWptnkx'},
          {amount: 100000, address: satoshiForest}
        ];
        var tx5 = wallet.prepareTx(0, recipients, change, 10000);
        
        commonTransactionChecks(tx, tx5);
        
        // One output for stealth data, two for recipients and another for change
        expect(tx5.stealth).toBe(true);
        expect(tx5.tx.outs.length).toBe(4);
        expect(tx5.tx.outs[0].value).toBe(0);
        expect(tx5.tx.outs[1].value).toBe(100000);
        expect(tx5.tx.outs[2].value).toBe(100000);
        expect(tx5.tx.outs[3].value).toBe(2790000);
      });
      
      it('from a different pocket', function() {
        var recipients = [{amount: 4990000, address: juiceRapNews}];
        var tx6 = wallet.prepareTx(1, recipients, change, 10000);
        
        expect(tx6.total).toBe(4990000);
        expect(tx6.fee).toBe(10000);
        expect(tx6.change).toBe(0);
        expect(tx6.myamount).toBe(5000000);
        expect(tx6.tx.version).toBe(1);
        expect(tx6.tx.ins[0].outpoint.hash).toBe('c137710d91140ebaca2ca0f6e1608325c5dbf8ecef13dd50bacccb365a7d155c');
        expect(tx6.tx.ins[0].outpoint.index).toBe('0');
        expect(tx6.utxo[0].address).toBe('1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs');
        expect(tx6.utxo[0].value).toBe(5000000);
        
        // Only one output because we don't have change in this transaction
        expect(tx6.stealth).toBe(false);
        expect(tx6.tx.outs.length).toBe(1);
        expect(tx6.tx.outs[0].value).toBe(4990000);
        
        expect(function() {
          wallet.prepareTx('not an index', recipients, change, 10000)
        }).toThrow();
      });
      
      it('with a different fee', function() {
        var recipients = [{amount: 200000, address: juiceRapNews}];
        var tx7 = wallet.prepareTx(0, recipients, change, 20000);
        
        expect(tx7.fee).toBe(20000);
        expect(tx7.change).toBe(3000000 - 200000 - 20000);
        expect(tx7.tx.outs[1].value).toBe(3000000 - 200000 - 20000);
      });
    });
    
    it('signs given transaction outputs');
    
    it('processes an output for an external source');
    
    it('checks if transaction involves given addres');
    
    it('processes incoming transaction')
    
    it('processes history report from obelisk');
    
    it('gets the stealth scanning ECKey');
    
    it('processes stealth array from obelisk');
  });
});
