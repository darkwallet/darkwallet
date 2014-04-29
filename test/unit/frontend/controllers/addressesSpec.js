'use strict';

define(['angular-mocks', 'testUtils'], function (mocks, testUtils) {

describe('Addresses controller', function() {
    
    var addressesController, scope, wallet, history, identity, clipboard;
    
    beforeEach(function(done) {

      identity = {
        store: {
          save: function() {}
        }
      };
      spyOn(identity.store, 'save');

      testUtils.stub('darkwallet', {
        getIdentity: function() {
          return identity;
        }
      });
      
      testUtils.loadWithCurrentStubs('frontend/controllers/addresses', function(loadedModule) {
        mocks.module("DarkWallet.controllers");
        mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
          scope = $rootScope.$new();
          scope.pocket = {
            name: 'default',
            addresses: [
              0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23
            ],
            changeAddresses: [
              -1, -2, -3, -4
            ]
          };
          wallet = {
            generateAddress: function(){}
          };
          spyOn(wallet, 'generateAddress');
          history = {
            addrFilter: 'even',
            setAddressFilter: function(){},
            addressFilter: function() {}
          };
          spyOn(history, 'setAddressFilter').and.callFake(function(name) {
            return name;
          });
          spyOn(history, 'addressFilter').and.callFake(function(row) {
            return row % 2 == 0;
          });
          clipboard = {
            copy: function() {}
          };
          spyOn(clipboard, 'copy');
          addressesController = $controller('AddressesCtrl', {
            $scope: scope,
            $wallet: wallet,
            $history: history,
            clipboard: clipboard
          });
          done();
        }]);
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    });
    
    it('is created properly', function() {
      expect(scope.addrFilter).toBe('even');
    });
    
    it('generates an address', function() {
      scope.address = [];
      scope.allAddress = [];
      scope.generateAddress(1, 5);
      expect(wallet.generateAddress).toHaveBeenCalledWith(1, 5);
    });
    
    it('sets address filter', function() {
      scope.setAddressFilter('even');
      expect(history.setAddressFilter).toHaveBeenCalledWith('even');
      expect(scope.addrFilter).toBe('even');
      expect(scope.allAddresses).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, -2, -4]);
      expect(scope.nPages).toBe(2);
      expect(scope.page).toBe(0);
      expect(scope.addresses).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
    });
    
    it('sets page', function() {
      scope.setAddressFilter('even');
      scope.setPage(1);
      expect(scope.page).toBe(1);
      expect(scope.addresses).toEqual([20, 22, -2, -4]);
    });
    
    it('applies filter', function() {
      var row = 'row';
      scope.addressFilter(row);
      expect(history.addressFilter).toHaveBeenCalledWith(row);
    });
    
    it('copies public key to clipboard', function() {
      var walletAddress = {
        "pubKey": [3, 50, 218, 12, 146, 113, 33, 187, 22, 13, 255, 253, 179, 214, 231, 44, 106, 101, 42, 32, 131, 221, 191, 197, 41, 239, 222, 46, 25, 98, 164, 161, 135]
      };
      scope.copyClipboardPublic(walletAddress);
      expect(clipboard.copy).toHaveBeenCalledWith('0332da0c927121bb160dfffdb3d6e72c6a652a2083ddbfc529efde2e1962a4a187', 'Copied public key to clipboard');
    });
    
    it('saves store', function() {
      scope.saveStore();
      expect(identity.store.save).toHaveBeenCalled();
    });
    
    it('sets address filter on pocket name changes', function() {
      spyOn(scope, 'setAddressFilter');
      scope.$apply(function() {
        scope.pocket.name = 'changed';
      });
      expect(scope.setAddressFilter).toHaveBeenCalledWith('even');
    });
});
});
