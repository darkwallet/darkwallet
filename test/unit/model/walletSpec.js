/*
 * @fileOverview Access to the identity bitcoin keys
 */

define(['model/wallet'], function(Wallet) {
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
            "stealth": "6aeULeRnhpVvyEWt4beammQZURTHoQSuEJxujHmcD6NDMDgGtyA5YvURXrV4uoFYCvH6gmcPZVB66APdYimxhnjYhkpxxRLyfypyrj7"
          },
          "2": {
            "address": "1Ga7oYeQGEqzv8eKdFs4TY16EErmLARoT",
            "balance": 0,
            "index": [2],
            "label": "pocket",
            "mpk": "xpub6BHYkb4s4V7ntMRdkpZeZMAgFBAhpayJuKWb6D8guAVYE7ZBUe2fFMwwYNEc3bCk9avs8yW5FxKohiFdCcaWUMpPuf6wESkpzMbFwxscLMk",
            "nOutputs": 0,
            "pubKey": [2, 35, 181, 36, 236, 224, 182, 149, 11, 178, 18, 146, 253, 173, 244, 241, 78, 198, 155, 254, 180, 33, 78, 31, 227, 88, 141, 36, 244, 42, 235, 171, 115],
            "stealth": "6aeULeRnhpVvyEWt4beammQZURTHoQSuEJxujHmcD6NDMDgGty9CjXHWaEpCMtX1WVPUq8bmmE2QZdzWRJJapwbu5LkRhfuXFTpnJwL"
          },
          "0,0": {
            "address": "1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ",
            "balance": 40000,
            "height": 287813,
            "history": [
              ["a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329", 0, 287813, 40000, null, null, null]
            ],
            "index": [0, 0],
            "label": "unused",
            "nOutputs": 1,
            "pubKey": [3, 50, 218, 12, 146, 113, 33, 187, 22, 13, 255, 253, 179, 214, 231, 44, 106, 101, 42, 32, 131, 221, 191, 197, 41, 239, 222, 46, 25, 98, 164, 161, 135]
          },
          "2,0": {
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
              _store[i] = wallet[i];
            }
          }
        }
      };
      wallet = new Wallet(identity.store, identity);
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
      expect(wallet.pockets).toEqual([{name: 'default'}, {name: 'savings'}]);
      expect(wallet.pocketWallets).toEqual([{addresses: ['1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ'], balance: 0}, {addresses: ['1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs' ], balance: 0}]);
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
      expect(wallet.pockets).toEqual([{name: 'default'}, {name: 'savings'}]);
      expect(wallet.pocketWallets).toEqual([{addresses: [], balance: 0}, {addresses: [], balance: 0}]);
      expect(wallet.mpk).toBeFalsy();
      expect(wallet.wallet).toBeDefined();
      expect(wallet.multisig).toBeDefined();
    });
    
    it('gets balance', function() {
      expect(wallet.getBalance()).toBe(5040000);
      expect(wallet.balance).toBe(5040000);
      
      expect(wallet.getBalance('0')).toBe(40000);
      expect(wallet.getBalance('2')).toBe(5000000);
    });
    
    it('creates a pocket', function() {
      var pockets = [{name: 'default'}, {name: 'savings'}, {name: 'Spendings'}];
      wallet.createPocket('Spendings');
      expect(wallet.pockets).toEqual(pockets);
      expect(_store.pockets).toEqual(pockets);
      expect(wallet.pocketWallets.length).toBe(3);

      // Do not allow duplicates
      expect(function() {
        wallet.createPocket('Spendings');
      }).toThrow();
    });
    
    it('initializes a pocket', function() {
      wallet.initPocket(100);
      expect(wallet.pocketWallets[100]).toEqual({addresses: [], balance: 0});
    });
    
    it('gets a pocket', function() {
      wallet.pockets = [{name: 'default'}, {name: 'savings'}, {name: 'Spendings'}];
      expect(wallet.getPocket('savings')).toBe(wallet.pockets[1]);
    });
    
    it('deletes a pocket', function() {
      var pockets = [{name: 'default'}, {name: 'savings'}];
      expect(function() {
        wallet.deletePocket('incorrect');
      }).toThrow();
      
      wallet.deletePocket('default');
      expect(wallet.pockets).toEqual([null, {name: 'savings'}]);
      expect(_store.pockets).toEqual([null, {name: 'savings'}]);
      expect(wallet.pocketWallets.length).toBe(2);
    });
    
    it('get pocket index for an address', function() {
      expect(wallet.getAddressPocketIdx({index: [0]})).toBe(0);
      expect(wallet.getAddressPocketIdx({index: [1]})).toBe(0);
      expect(wallet.getAddressPocketIdx({index: [2]})).toBe(1);
      expect(wallet.getAddressPocketIdx({index: [3]})).toBe(1);
      
      expect(wallet.getAddressPocketIdx({index: [0], type: 'stealth'})).toBe(0);
      expect(wallet.getAddressPocketIdx({index: [1], type: 'stealth'})).toBe(0);
      expect(wallet.getAddressPocketIdx({index: [2], type: 'stealth'})).toBe(1);
      expect(wallet.getAddressPocketIdx({index: [3], type: 'stealth'})).toBe(1);
      
      expect(wallet.getAddressPocketIdx({index: [0], type: 'multisig'})).toBe(0);
      expect(wallet.getAddressPocketIdx({index: ['hi'], type: 'multisig'})).toBe('hi');
      expect(wallet.getAddressPocketIdx({index: ['32...'], type: 'multisig'})).toBe('32...');
      expect(wallet.getAddressPocketIdx({index: [3], type: 'multisig'})).toBe(3);
    });
    
    it('adds an address to a pocket', function() {
      _store = {};
      _private = {};
      wallet = new Wallet(identity.store, identity);
      
      wallet.addToPocket({index: [0,1], address: '10...'});
      wallet.addToPocket({index: [0,2], address: '12...'});
      wallet.addToPocket({index: [1,1], address: '14...'});
      wallet.addToPocket({index: [2,1], address: '16...'});
      expect(wallet.pocketWallets).toEqual([
        {addresses: ['10...', '12...', '14...'], balance: 0},
        {addresses: ['16...'], balance: 0}
      ]);
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
      expect(wallet.pocketWallets).toEqual([
        {addresses: ['10...', '12...', '14...'], balance: 0},
        {addresses: ['16...'], balance: 0}
      ]);
      expect(_store.wallet.addresses).toEqual(['10...', '12...', '14...', '16...']);
    });
    
    it('loads public keys', function() { // private
      expect(wallet.wallet.addresses).toEqual([ '18a2oJD4prCzbdvL5Z8rDKn5Xj7Z7KeTLy', '1Ga7oYeQGEqzv8eKdFs4TY16EErmLARoT', '1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ', '1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs' ]);
      expect(wallet.pocketWallets[0].addresses).toEqual(['1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ']);
      expect(wallet.pocketWallets[1].addresses).toEqual(['1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs']);
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
    
    it('stores private key', function() {
      _store = {};
      _private = {privKeys: {}};
      wallet = new Wallet(identity.store, identity);
      
      var key = {
        export: function() { return 'mock'; }
      };
      wallet.storePrivateKey([0,1], 'p4ssw0rd', key);
      expect(_private.privKeys).toEqual({'0,1': 'mock'});
    });
    
    it('stores address', function() {
      var key = [3, 230, 108, 78, 135, 206, 92, 61, 135, 181, 251, 31, 231, 198, 73, 21, 65, 11, 154, 52, 37, 14, 154, 215, 149, 56, 212, 154, 91, 187, 111, 254, 70];
      
      // unused
      var walletAddress = wallet.storeAddress([0,6], key);
      expect(walletAddress.index).toEqual([0,6]);
      expect(walletAddress.label).toEqual('unused');
      expect(walletAddress.balance).toEqual(0);
      expect(walletAddress.nOutputs).toEqual(0);
      expect(walletAddress.pubKey).toEqual(key);
      expect(walletAddress.address).toEqual('16446XF652ofnwTDEMuEMGu1aNHkg6GrXH');
      expect(walletAddress.stealth).toBeUndefined();
      expect(wallet.wallet.addresses).toContain('16446XF652ofnwTDEMuEMGu1aNHkg6GrXH');
      
      // change
      walletAddress = wallet.storeAddress([1,6], key);
      expect(walletAddress.label).toEqual('change');
      expect(walletAddress.stealth).toBeUndefined();
      
      // pocket
      walletAddress = wallet.storeAddress([0], key);
      expect(walletAddress.label).toEqual('pocket');
      expect(walletAddress.stealth).toBe('6aeULeRnhpVvyEWt4beammQZURTHoQSuEJxujHmcD6NDMDgGtyAMQb5MEFQEjC141B5kwducdtYHayJkQ2K1obGXXLQ4JP3uEbB3UPY');
    });
    
    it('gets address', function() {
      // Already stored
      expect(wallet.getAddress([0,1]).address).toBe('1ptDzNsRy3CtGm8bGEfqx58PfGERmXCgs');
      // Derive and store
      expect(wallet.getAddress([5,1]).address).toBe('1LMCt3RZ2fX3Tv4aSUdJxpjZ2AL72Fw7NK');
      expect(wallet.wallet.addresses).toContain('1LMCt3RZ2fX3Tv4aSUdJxpjZ2AL72Fw7NK');
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
   
    it('get pockets wallet');
    
    it('gets utxo to pay');
    
    it('prepares a transaction with the given constraints');
    
    it('signs given transaction outputs');
    
    it('processes an output for an external source');
    
    it('checks if transaction involves given addres');
    
    it('processes incoming transaction')
    
    it('processes history report from obelisk');
    
    it('gets the stealth scanning ECKey');
    
    it('processes stealth array from obelisk');
  });
});
