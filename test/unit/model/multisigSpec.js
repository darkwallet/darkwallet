/*
 * @fileOverview Multisig funds
 */
'use strict';

define(['model/multisig'], function(Multisig) {
  describe('Multisig model', function() {
    var multisig, store, identity, wallet;
    
    var fund = {
      name: 'Darkwallet',
      address: '32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc'
    }
    var walletAddress = {
      type : 'multisig',
      index : [ '32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc', 'm' ],
      label : 'Darkwallet',
      balance : 0,
      nOutputs : 0,
      address : '32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc'
    };
    
    beforeEach(function() {
      identity = {
        wallet: {
          network: 'bitcoin',
          getWalletAddress: function(address) { return {address: address}; },
          addToWallet: function(address) {},
          pockets: {
            getPocket: function() {return {destroy: function() {}};}
          }
        },
        store: {
          init: function(key, value) {
            return value;
          },
          save: function() {}
        }
      };
      store = identity.store;
      wallet = identity.wallet;
      multisig = new Multisig(store, identity, wallet);
      
      spyOn(multisig.store, 'save');
      spyOn(identity.wallet, 'addToWallet');

    });
    
    it('is created properly', function() {
      expect(multisig.funds).toEqual([]);
      expect(multisig.identity).toBe(identity);
      expect(multisig.wallet).toBe(wallet);
      expect(multisig.store).toBe(store);
    });

    it('initialize wallet addresses', function() {
      expect(multisig.initWalletAddress(fund)).toEqual(walletAddress);
      expect(fund.seq).toEqual([ '32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc', 'm' ]);
      expect(identity.wallet.addToWallet).toHaveBeenCalledWith(walletAddress);
    });

    it('adds a fund', function() {
      expect(multisig.addFund(fund)).toEqual(walletAddress);
      expect(multisig.store.save).toHaveBeenCalled();
    });

    it('adds an incorrect fund', function() {
      expect(function() {
          multisig.addFund({});
      }).toThrow();
    });

    it('inits an incorrect wallet address', function() {
      var res = multisig.initWalletAddress({name: 'foo'});
      expect(res).toBeUndefined();

      res = multisig.initWalletAddress({address: 'foo'});
      expect(res).toBeUndefined();
    });

    it('can sign', function() {
      fund.pubKeys = [[3, 123, 59, 225, 128, 197, 206, 249, 253, 237, 201, 130, 53, 141, 216, 232, 237, 37, 199, 173, 239, 231, 249, 208, 88, 211, 64, 129, 37, 195, 146, 73, 182]];
      expect(multisig.canSign(fund)).toEqual([0]);
    });

    it('can search', function() {
      multisig.addFund(fund);
      var res = multisig.search({address: '32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc'})
      expect(res.address).toEqual('32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc');
    });

    it('deletes a fund', function() {
      multisig.addFund(fund);
      expect(multisig.funds.length).toBe(1);
      multisig.deleteFund(fund);
      expect(multisig.funds.length).toBe(0);
      expect(multisig.store.save).toHaveBeenCalled();
    });

    it('deletes an unexisting fund', function() {
      expect(function() {
        multisig.deleteFund(fund);
      }).toThrow();
    });


  });
});
