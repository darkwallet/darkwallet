/*
 * @fileOverview Access to the identity bitcoin keys
 */
'use strict';

define(['model/wallet', 'bitcoinjs-lib'], function(Wallet, Bitcoin) {
  describe('Wallet model', function() {
    
    var identity, wallet, _store, _private, initIfEmpty;
 

    beforeEach(function() {
      // inhibit initIfEmpty for part of the tests so it doesn't need
      // so much processing   
      initIfEmpty = Wallet.prototype.initIfEmpty;
      Wallet.prototype.initIfEmpty = function() {};
      // Store
      _store = {
        version: 4,
        mpks: ['mpk1', 'mpk2', 'mpk3'],
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
            "index": [2, 0],
            "label": "unused",
            "nOutputs": 1,
            "pubKey": [2, 41, 140, 192, 149, 205, 83, 114, 37, 106, 0, 164, 123, 46, 88, 38, 11, 252, 215, 149, 236, 188, 150, 165, 89, 64, 40, 218, 206, 26, 13, 49, 27]
          }
        },
        outputs: [
          ["a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329:0", 40000, '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ', 287813, null, null, null],
          ["64a286efcfa61bd467b721fd3ae4bb566504c328bb7d7762898de966da49dea6:1", 3000000, '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ', 287583, null, null, null],
          ["c137710d91140ebaca2ca0f6e1608325c5dbf8ecef13dd50bacccb365a7d155c:0", 5000000, '1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs', 269614, null, null, null]
        ],
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
          }
        },
        history: {
          history: []
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
    
    afterEach(function() {
      Wallet.prototype.initIfEmpty = initIfEmpty;
    });

    it('creates an empty wallet correctly', function() {
      Wallet.prototype.initIfEmpty = initIfEmpty;
      var anMpk = 'xpub693Ab9Kv7vQjSJ9fZLKAWjqPUEjSyM7LidCCZW8wGosvZKi3Pf2ijiGe1MDTBmQnpXU795HNb4ebuW95tbLNuAzXndALZpRkRaRCbXDhafA';
      _store = {version: 5, mpks: [anMpk, anMpk, anMpk]};
      var myWallet = new Wallet(identity.store, identity);
      expect(Object.keys(myWallet.pubKeys).length).toBe(9);
      expect(Object.keys(myWallet.pubKeys)).toEqual(['0,0,0', '0,0,1', '0,1,0', '1,0,0', '1,0,1', '1,1,0', '2,0,0', '2,0,1', '2,1,0']);
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
      expect(wallet.pockets.hdPockets).toEqual([{name: 'spending', mpk: 'mpk1'}, {name: 'business', mpk: 'mpk2'}, {name: 'savings', mpk: 'mpk3'}]);
      expect(wallet.pockets.pockets.hd[0].addresses).toEqual(['18a2oJD4prCzbdvL5Z8rDKn5Xj7Z7KeTLy', '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ']);
      expect(wallet.pockets.pockets.hd[1].addresses).toEqual(['1Ga7oYeQGEqzv8eKdFs4TY16EErmLARoT', '1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs']);
      expect(wallet.mpk).toBe('xpub693Ab9Kv7vQjSJ9fZLKAWjqPUEjSyM7LidCCZW8wGosvZKi3Pf2ijiGe1MDTBmQnpXU795HNb4ebuW95tbLNuAzXndALZpRkRaRCbXDhafA');
      expect(wallet.wallet).toBeDefined();
      expect(wallet.multisig).toBeDefined();

      _store = {version: 4, mpks: ['mpk1', 'mpk2', 'mpk3']};
      _private = {};
      wallet = new Wallet(identity.store, identity);
      expect(wallet.identity).toBe(identity);
      expect(wallet.store).toBe(identity.store);
      expect(wallet.is_cold).toBeFalsy();
      expect(wallet.fee).toBe(10000); // 0.1 mBTC
      expect(wallet.pubKeys).toEqual({});
      expect(wallet.scanKeys).toEqual([]);
      expect(wallet.pockets.hdPockets).toEqual([{name: 'spending', mpk: 'mpk1'}, {name: 'business', mpk: 'mpk2'}, {name: 'savings', mpk: 'mpk3'}]);
      expect(wallet.pockets.pockets.hd[0].addresses).toEqual([]);
      expect(wallet.pockets.pockets.hd[1].addresses).toEqual([]);
      expect(wallet.pockets.pockets.hd[2].addresses).toEqual([]);
      expect(wallet.pockets.pockets.hd[0].store.name).toEqual('spending');
      expect(wallet.pockets.pockets.hd[1].store.name).toEqual('business');
      expect(wallet.pockets.pockets.hd[2].store.name).toEqual('savings');
      expect(wallet.mpk).toBeFalsy();
      expect(wallet.wallet).toBeDefined();
      expect(wallet.multisig).toBeDefined();
    });
    
    it('gets balance', function() {
      var balance = wallet.getBalance();
      expect(balance.confirmed).toBe(8040000);
      
      expect(wallet.getBalance(0)).toEqual({ confirmed : 3040000, unconfirmed : 0, current: 3040000 });
      expect(wallet.getBalance(1)).toEqual({ confirmed : 5000000, unconfirmed : 0, current: 5000000 });
    });
    
    it('creates a pocket', function() {
      var pockets = [{name: 'spending', mpk: 'mpk1'}, {name: 'business', mpk: 'mpk2'}, {name: 'savings', mpk: 'mpk3'}, {name: 'Spendings'}];
      wallet.pockets.createPocket('Spendings');
      expect(wallet.pockets.hdPockets).toEqual(pockets);
      expect(Object.keys(wallet.pockets.pockets.hd).length).toBe(4);
      // Do not allow duplicates
      expect(function() {
        wallet.pockets.createPocket('Spendings');
      }).toThrow();
    });
    
    it('initializes a pocket', function() {
      wallet.pockets.initPocketWallet(100, 'hd');
      var pocket = wallet.pockets.pockets.hd[100];
      expect(pocket.addresses).toEqual([]);
      expect(pocket.balance).toEqual(0);
    });
    
    it('gets a pocket', function() {
      expect(wallet.pockets.getPocket(1).store).toEqual(wallet.pockets.hdPockets[1]);
    });

    it('gets an address pocket', function() {
      var pocket1 = wallet.pockets.getAddressPocket({type: undefined, index: [0, 0]});
      var pocket2 = wallet.pockets.getAddressPocket({type: undefined, index: [2, 0]});
      expect(pocket1.type).toBe('hd');
      expect(pocket1.getPocketId()).toBe(0);
      expect(pocket2.type).toBe('hd');
      expect(pocket2.getPocketId()).toBe(1);
    });
    
    it('deletes a pocket', function() {
      expect(function() {
        wallet.pockets.deletePocket('incorrect', 'foo');
      }).toThrow();
      
      wallet.pockets.pockets.hd[0].destroy();
      expect(wallet.pockets.hdPockets).toEqual([null, {name: 'business', mpk: 'mpk2'}, {name: 'savings', mpk: 'mpk3'}]);
      expect(Object.keys(wallet.pockets.pockets.hd).length).toBe(2);
    });
    
    it('get pocket index for an address', function() {
      _store.version = 4;
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

      _store.version = 5;
      expect(wallet.pockets.getAddressPocketId({index: [0]})).toBe(0);
      expect(wallet.pockets.getAddressPocketId({index: [1]})).toBe(0);
      expect(wallet.pockets.getAddressPocketId({index: [2]})).toBe(1);
      expect(wallet.pockets.getAddressPocketId({index: [3]})).toBe(1);

       expect(wallet.pockets.getAddressPocketId({index: [0], type: 'hd'})).toBe(0);
      expect(wallet.pockets.getAddressPocketId({index: [1], type: 'pocket'})).toBe(1);
      expect(wallet.pockets.getAddressPocketId({index: [2], type: 'hd'})).toBe(2);
      expect(wallet.pockets.getAddressPocketId({index: [3], type: 'pocket'})).toBe(3);
      
      expect(wallet.pockets.getAddressPocketId({index: [0], type: 'stealth'})).toBe(0);
      expect(wallet.pockets.getAddressPocketId({index: [1], type: 'stealth'})).toBe(1);
      expect(wallet.pockets.getAddressPocketId({index: [2], type: 'stealth'})).toBe(2);
      expect(wallet.pockets.getAddressPocketId({index: [3], type: 'stealth'})).toBe(3);
      
      expect(wallet.pockets.getAddressPocketId({index: [0], type: 'multisig'})).toBe(0);
      expect(wallet.pockets.getAddressPocketId({index: ['hi'], type: 'multisig'})).toBe('hi');
      expect(wallet.pockets.getAddressPocketId({index: ['32...'], type: 'multisig'})).toBe('32...');
      expect(wallet.pockets.getAddressPocketId({index: [3], type: 'multisig'})).toBe(3);

    });
    
    it('adds an address to a pocket', function() {
      _store = {version: 4};
      _private = {};
      wallet = new Wallet(identity.store, identity);
      
      wallet.pockets.addToPocket({index: [0,1], address: '10...'});
      wallet.pockets.addToPocket({index: [0,2], address: '12...'});
      wallet.pockets.addToPocket({index: [1,1], address: '14...'});
      wallet.pockets.addToPocket({index: [2,1], address: '16...'});
      expect(wallet.pockets.pockets.hd[0].addresses).toEqual([ '10...', '12...', '14...' ]);
      expect(wallet.pockets.pockets.hd[1].addresses).toEqual([ '16...' ]);
    });
    
    it('adds an addres to itself', function() {
      _store = {version: 4, mpks: ['mpk1', 'mpk2', 'mpk3']};
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
      expect(wallet.pockets.pockets.hd[0].addresses).toEqual([ '10...', '12...', '14...' ]);
      expect(wallet.pockets.pockets.hd[1].addresses).toEqual([ '16...' ]);
    });
    
    it('loads public keys', function() { // private
      expect(wallet.wallet.addresses).toEqual([ '18a2oJD4prCzbdvL5Z8rDKn5Xj7Z7KeTLy', '1Ga7oYeQGEqzv8eKdFs4TY16EErmLARoT', '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ', '1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs' ]);
      expect(wallet.pockets.pockets.hd[0].addresses).toEqual(['18a2oJD4prCzbdvL5Z8rDKn5Xj7Z7KeTLy', '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ']);
      expect(wallet.pockets.pockets.hd[1].addresses).toEqual(['1Ga7oYeQGEqzv8eKdFs4TY16EErmLARoT', '1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs']);
    });
    
    it('gets private key', function() {
      wallet.getPrivateKey({index: [0,1]}, 'p4ssw0rd', function(priv) {
        expect(priv.d[0]).toEqual(55140896);
        expect(priv.d[4]).toEqual(50599429);
        expect(priv.d[10]).toEqual(0);
        expect(priv.d['t']).toEqual(10);
        expect(priv.d['s']).toEqual(0);
        expect(priv.pub.compressed).toBe(true);
      });
    });

    it('gets a pocket private key', function() {
      var walletPocket = wallet.pockets.getPocket(0);
      var priv = walletPocket.getMasterKey(0, 'p4ssw0rd');

      expect(priv).toBe("xprv9xJCM5XyE7ZVcYR7MEVPSXXG2pWNtoqKKNiAc54d9hYt1thwKHgbwCqF3tr3kwNVQzyRND5PojJHaDTT62iXfU67m91ZUdYzMqm7uKSjb6J");
    });

    it('gets a stealth private key', function() {
      var walletPocket = wallet.pockets.getPocket(0);
      var masterKey = Bitcoin.HDNode.fromBase58(walletPocket.getMasterKey(0, 'p4ssw0rd'));

      var ephemKey = [2, 41, 140, 192, 149, 205, 83, 114, 37, 106, 0, 164, 123, 46, 88, 38, 11, 252, 215, 149, 236, 188, 150, 165, 89, 64, 40, 218, 206, 26, 13, 49, 27];
      var pocket = wallet.pockets.getPocket(0);
      var stealth = pocket.deriveStealthPrivateKey([0, 's'].concat(ephemKey), masterKey, {privKeys: {}});
      expect(stealth.pub.getAddress().toString()).toEqual("1GLYQWVd2Awgz4CkQC7jkenJue3nx2zLtU");
    });
 
    it('stores private key', function() {
      _store = {version: 4, mpks: ['mpk1', 'mpk2', 'mpk3']};
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
      var walletAddress = wallet.storePublicKey([0,6], key, {type: undefined, foo: 'bar'});
      expect(walletAddress.index).toEqual([0,6]);
      expect(walletAddress.label).toEqual('unused');
      expect(walletAddress.balance).toEqual(0);
      expect(walletAddress.nOutputs).toEqual(0);
      expect(walletAddress.pubKey).toEqual(key);
      expect(walletAddress.address).toEqual('16446XF652ofnwTDEMuEMGu1aNHkg6GrXH');
      expect(walletAddress.stealth).toBeUndefined();
      expect(walletAddress.type).toBeUndefined();
      expect(walletAddress.foo).toBe('bar');
      expect(wallet.wallet.addresses).toContain('16446XF652ofnwTDEMuEMGu1aNHkg6GrXH');
      
      // change
      walletAddress = wallet.storePublicKey([1,6], key);
      expect(walletAddress.label).toEqual('unused');
      expect(walletAddress.stealth).toBeUndefined();
      
      // pocket
      walletAddress = wallet.storePublicKey([0], key);
      expect(walletAddress.label).toEqual('unused');
      expect(walletAddress.stealth).toBe('vJmyLmVSTiTQYdMnXGe1SasS5sbkUMEqNqbkCFdFWWB1NxvyxGN4Ku9D2mxy9VA9KGXuFNpz8idDrtpAGPeu5qzWbgHmrmdDAKnYZH');
    });
    
    it('gets address', function() {
      // Already stored
      expect(wallet.getAddress([0,1]).address).toBe('1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs');
      // Derive and store
      expect(wallet.getAddress([0,7]).address).toBe('15E8YxPTste3wkwzB8qEe4htAinNoq54nT');
      expect(wallet.wallet.addresses).toContain('15E8YxPTste3wkwzB8qEe4htAinNoq54nT');
    });

    it('gets a free address', function() {
      // Already stored
      expect(wallet.pockets.getPocket(0, 'hd').getFreeAddress().address).toBe('1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs');
      // Derive and store
      expect(wallet.pockets.getPocket(0, 'hd').getFreeAddress(true).address).toBe('1JcmPQq3375pgukzqefdqQdpR4M9ThuR7x');
      expect(wallet.wallet.addresses).toContain('1JcmPQq3375pgukzqefdqQdpR4M9ThuR7x');
    });

    it('gets a change address', function() {
      // Already stored
      expect(wallet.pockets.getPocket(0).getChangeAddress().address).toBe('1JcmPQq3375pgukzqefdqQdpR4M9ThuR7x');
      // Derive and store
      var changeAddress = wallet.pockets.getPocket(1).getChangeAddress();
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
      expect(tmpWallet.addresses).toEqual(['18a2oJD4prCzbdvL5Z8rDKn5Xj7Z7KeTLy', '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ']);
      expect(Object.keys(tmpWallet.outputs).length).toBe(2);
      expect(tmpWallet.outputs["a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329:0"].value).toBe(40000);
      expect(tmpWallet.outputs["64a286efcfa61bd467b721fd3ae4bb566504c328bb7d7762898de966da49dea6:1"].value).toBe(3000000);
      
      tmpWallet = wallet.pockets.getPocketWallet(1);
      expect(tmpWallet.addresses).toEqual(['1Ga7oYeQGEqzv8eKdFs4TY16EErmLARoT', '1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs']);
      expect(Object.keys(tmpWallet.outputs).length).toBe(1);
      expect(tmpWallet.outputs["c137710d91140ebaca2ca0f6e1608325c5dbf8ecef13dd50bacccb365a7d155c:0"].value).toBe(5000000);
    });
    
    it('gets utxo to pay', function() {
      
      var history00 = [ 'a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329:0', 40000, '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ', 287813, null, null, null ];
      var history01 = [ '64a286efcfa61bd467b721fd3ae4bb566504c328bb7d7762898de966da49dea6:1', 3000000, '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ', 287583, null, null, null ]
      var history20 = [ 'c137710d91140ebaca2ca0f6e1608325c5dbf8ecef13dd50bacccb365a7d155c:0', 5000000, '1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs', 269614, null, null, null ];
      
      expect(wallet.getUtxoToPay(9000, 0)[0].store).toEqual(history00);
      expect(wallet.getUtxoToPay(400000, 0)[0].store).toEqual(history01);
      expect(wallet.getUtxoToPay(3040000, 0)[0].store).toEqual(history01);
      expect(wallet.getUtxoToPay(3040000, 0)[1].store).toEqual(history00);
      
      
      expect(wallet.getUtxoToPay(9000, 1)[0].store).toEqual([ 'c137710d91140ebaca2ca0f6e1608325c5dbf8ecef13dd50bacccb365a7d155c:0', 5000000, '1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs', 269614, null, null, null ]);
      
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
    
    it('processes an output for an external source');
    
    it('checks if transaction involves given addres');
    
    it('processes incoming transaction')
    
    it('processes history report from obelisk');
    
    it('gets the stealth scanning ECKey');
    
    it('processes stealth array from obelisk');
  });
});
