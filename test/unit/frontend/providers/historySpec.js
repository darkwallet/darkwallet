'use strict';

define(['angular-mocks', 'testUtils', 'date-mock'], function(mocks, testUtils, dateMock) {
  describe('History provider', function() {

    var history, walletProvider, scope;
    
    var pocket, identity;
    beforeEach(function(done) {
      dateMock.hook();
      pocket = {
        destroy: function() { this.destroyed=true;return [0, 1]; },
        getWalletAddresses: function() {return [];},
        getMainAddress: function() {return '17a7r4qa5FPCHiPwXYuH9nqZ1AobTkMVub';},
        store: {}
      }
      var historyStub = [
        {outPocket: 1, height: 0, current: 60, total: 60, impact: {1: {total: 60}}},
        {outPocket: 0, height: 12, current: 2000, total: 2000, impact: {0: {total: 2000}}},
        {outPocket: 0, height: 13, current: 200, total: 200, impact: {0: {total: 200}}},
        {outPocket: 0, height: 14, current: 1000, total: 1000, impact: {0: {total: 1000}}}];
      identity = {
        contacts: {
          generateContactHash: function() {return 'contacthash';},
          findByAddress: function() {}
        },
        history: {
          history: []
        },
        fillHistoryStub: function() { this.history.history = historyStub; },
        tasks: {
          tasks: {}
        },
        wallet: {
          getAddress: function() {return {address: '17a7r4qa5FPCHiPwXYuH9nqZ1AobTkMVub', stealth: 'vJmv6MZ2vjDAhbLndJnNkTYpmPS2jrYZHkthBdtdNmUp87gYvB4m4GMFsbLwjC7M1Ccj2NycUszkUEuRKEkLP9iq194SZ8EFkeYwd1'};},
          getBalance: function() {return {confirmed: 1000000, unconfirmed: 100000, current: 1000000};},
          multisig: {
            funds: [{address: 'fundAddress', pubKeys: []}]
          },
          pockets: {
            pockets: {hd: {0: pocket}, multisig: {'fundAddress': {}}},
            getPockets: function(type) {
              return identity.wallet.pockets.pockets.hd;
            },
            getPocket: function(pocketId, type) {
                return pocket;
            }
          }
        }
      };

      walletProvider = {
        removeAddress: function(walletAddress) {},
        allAddresses: ["17a7r4qa5FPCHiPwXYuH9nqZ1AobTkMVub"]
      };

      testUtils.stub('darkwallet', {
        service: {
          wallet: {
            blockDiff: 562.65 
          }
        },
        getIdentity: function() {
          return identity;
        }
      });
    
      testUtils.loadWithCurrentStubs('frontend/providers/history', function() {
        mocks.module("DarkWallet.providers");
        
        mocks.module(function($provide) {
          // Override services
          scope = {};
          $provide.value('$wallet', walletProvider);
          $provide.value('$rootScope', {$new: function() {return scope;}});
          $provide.value('$location', {});
        });
        
        mocks.inject(['$history', '$wallet', '$rootScope',
          function(_history_, _wallet_, _rootScope_) {
          history = _history_;
          done();
        }]);
      });
    });
    
    afterEach(function() {
      dateMock.restore();
      testUtils.reset();
    })
    
    it('creates the provider properly', function() {
      expect(history.txFilter).toBe('last');
      expect(history.addrFilter).toBe('unused');
      expect(history.$wallet).toBe(walletProvider);
      expect(history.rows).toEqual([]);
    });

    it('calculates the balance', function() {
      var balance = history.calculateBalance({index: 0, type: 'hd'});
 //     expect(identity.wallet.getBalance).toHaveBeenCalledWith(0, 'hd');
      expect(balance).toEqual({ confirmed : 1000000, unconfirmed : 100000, current : 1000000 });
    });

    it('is the current pocket', function() {
      history.pocket = {isAll: true}
      expect(history.isCurrentPocket(0)).toBe(true);
      history.pocket = {isAll: false, index: 0}
      expect(history.isCurrentPocket(0)).toBe(true);
      history.pocket = {isAll: false, index: 1}
      expect(history.isCurrentPocket(0)).toBeUndefined();
    });

    it('removes a pocket', function() {
      history.pocket = {type: 'hd', index: 0};
      history.removePocket('hd', 0)
      expect(history.pocket.isAll).toBe(true);
      expect(pocket.destroyed).toBe(true);
    });

    it('balance update', function() {
      history.onBalanceUpdate();
      expect(history.pocket.balance).toEqual({ confirmed : 1000000, unconfirmed : 100000, current : 1000000 });
    });

    it('get current pocket', function() {
      var current = history.getCurrentPocket();
      expect(current.isAll).toBe(true);
    });

    it('set current pocket to all', function() {
      var res = history.setCurrentPocket('all');
      expect(res).toBe(true);
    });

    it('set current pocket to hd', function() {
      var res = history.setCurrentPocket('hd', 0);
      expect(history.pocket.type).toBe('hd');
      expect(res).toBe(true);
    });

    it('set current pocket to readonly', function() {
      var res = history.setCurrentPocket('readonly', 0);
      expect(history.pocket.type).toBe('readonly');
      expect(res).toBe(true);
    });

    it('set current pocket to multisig', function() {
      var res = history.setCurrentPocket('multisig', 0);
      expect(history.pocket.isFund).toBe(true);
      expect(history.pocket.type).toBe('multisig');
      expect(res).toBe(true);
    });

    it('select all', function() {
      history.selectAll();
      expect(history.pocket.type).toBe('all');
      expect(history.pocket.isAll).toBe(true);
      expect(history.pocket.isFund).toBe(false);
      expect(history.pocket.readOnly).toBe(false);
    });

    it('chooses rows', function() {
      history.selectAll();
      identity.fillHistoryStub();
      var rows = history.chooseRows();
      expect(rows.length).toEqual(4);
    });

    it('chooses rows monthly', function() {
      history.selectAll();
      history.setHistoryFilter('monthly');
      identity.fillHistoryStub();
      var rows = history.chooseRows();
      expect(rows.length).toEqual(76);
    });

    it('chooses rows weekly', function() {
      history.selectAll();
      history.setHistoryFilter('weekly');
      identity.fillHistoryStub();
      var rows = history.chooseRows();
      expect(rows.length).toEqual(304);
    });

    it('chooses rows for pocket', function() {
      history.setCurrentPocket('hd', 0);
      identity.fillHistoryStub();
      var rows = history.chooseRows();
      expect(rows.length).toEqual(3);
    });

    it('clear row contacts', function() {
      var contact = {name: 'foo'};
      identity.fillHistoryStub();
      identity.history.history[1].contact = contact;
      var res = history.clearRowContacts(contact);
      expect(identity.history.history[1].contact).toBeUndefined();
    });

    it('set the address filter', function() {
      history.setAddressFilter('top');
      expect(history.addrFilter).toBe('top');
    });

  });
});
