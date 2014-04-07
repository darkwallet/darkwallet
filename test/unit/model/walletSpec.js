/*
 * @fileOverview Access to the identity bitcoin keys
 */

define(['model/wallet'], function(Wallet) {
  describe('Wallet model', function() {
    
    var identity, wallet, _store, _private;
    
    beforeEach(function() {
      identity = {
        store: {
          init: function(key, value) {
            return value;
          },  
          get: function() {
            
          },
          set: function() {
            
          },
          getPrivateData: function(password) {
            return _private || {
              privKeys: {
                
              }
            };
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
      expect(wallet.pubKeys).toEqual({});
      expect(wallet.scanKeys).toEqual([]);
      expect(wallet.pockets).toEqual(['default']);
      expect(wallet.pocketWallets).toEqual([{addresses: [], balance: 0}]);
      expect(wallet.mpk).toBeFalsy();
      expect(wallet.wallet).toBeDefined();
      expect(wallet.multisig).toBeDefined();
    });
    
    it('gets balance');
    
    it('creates a pocket', function() {
      wallet.createPocket('Spendings');
      expect(wallet.pockets).toEqual(['default', 'Spendings']);
      expect(_store.pockets).toEqual(['default', 'Spendings']);
      expect(wallet.pocketWallets.length).toBe(2);

      // Do not allow duplicates
      wallet.createPocket('Spendings');
      expect(wallet.pockets).toEqual(['default', 'Spendings']);
      expect(_store.pockets).toEqual(['default', 'Spendings']);
      expect(wallet.pocketWallets.length).toBe(2);
    });
    
    it('deletes a pocket', function() {
      wallet.deletePocket('incorrect');
      expect(wallet.pockets).toEqual(['default']);
      expect(_store.pockets).toEqual(['default']);
      expect(wallet.pocketWallets.length).toBe(1);
      
      wallet.deletePocket('default');
      expect(wallet.pockets).toEqual([null]);
      expect(_store.pockets).toEqual([null]);
      expect(wallet.pocketWallets.length).toBe(1);
    });
    
    it('renames a pocket', function() {
      wallet.renamePocket('default', 'Main pocket');
      expect(wallet.pockets).toEqual(['Main pocket']);
      expect(_store.pockets).toEqual(['Main pocket']);
      expect(wallet.pocketWallets.length).toBe(1);
      
      wallet.renamePocket('incorrect', '404');
      expect(wallet.pockets).toEqual(['Main pocket']);
      expect(_store.pockets).toEqual(['Main pocket']);
      expect(wallet.pocketWallets.length).toBe(1);
      
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
    
    it('loads public keys'); // private
    
    xit('gets private key', function() {
      wallet.getPrivateKey([0,1], 'p4ssw0rd', function(priv) {
        expect(priv).toBe('');
      });
      
    });
    
    it('stores private key', function() {
      var key = {
        export: function() { return 'mock'; }
      };
      wallet.storePrivateKey([0,1], 'p4ssw0rd', key);
      expect(_private).toEqual({privKeys: {'0,1': 'mock'}});
    });
    
    it('stores address');
    
    it('gets address');
    
    it('gets wallet address');
    
    it('sets default fee', function() {
      expect(wallet.fee).toBe(10000);
      wallet.setDefaultFee(20000);
      expect(wallet.fee).toBe(20000);
      expect(_store.fee).toBe(20000);
    });
    
    it('broadcasts transactions', function() {
      var tx = {};
      tx.serializeHex = function() { return "newTx"; };
      
      wallet.broadcastTx(tx, false, function(err, data) {
        expect(err).toBeFalsy();
        expect(data.radar).toBeDefined();
      });
      
      tx.serializeHex = function() { return "newTxError"; };
      
      wallet.broadcastTx(tx, false, function(err, data) {
        expect(err).toBeTruthy();
      });
    });
    
    it('get pockets wallet');
    
    it('gets utxo to pay');
    
    it('sends bitcoins');
    
    it('processes output');
    
    it('processes history');
    
    it('gets scan key');
    
    it('process stealth');
  });
});
