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
          addToWallet: function(address) {}
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
  });
});
