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
          wallet = {
            generateAddress: function(){}
          };
          spyOn(wallet, 'generateAddress');
          history = {
            addrFilter: 'all',
            setAddressFilter: function(){},
            addressFilter: function() {}
          };
          spyOn(history, 'setAddressFilter').and.callFake(function(name) {
            return name;
          });
          spyOn(history, 'addressFilter');
          clipboard = {
            copyClipboard: function() {}
          };
          spyOn(clipboard, 'copyClipboard');
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
      expect(scope.addrFilter).toBe('all');
    });
    
    it('generates an address', function() {
      scope.generateAddress(1, 5);
      expect(wallet.generateAddress).toHaveBeenCalledWith(1, 5);
    });
    
    it('sets address filter', function() {
      scope.setAddressFilter('unused');
      expect(scope.addrFilter).toBe('unused');
      expect(scope.historyRows).toBe('unused');
      expect(history.setAddressFilter).toHaveBeenCalledWith('unused');
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
      expect(clipboard.copyClipboard).toHaveBeenCalledWith('0332da0c927121bb160dfffdb3d6e72c6a652a2083ddbfc529efde2e1962a4a187', 'Copied public key to clipboard');
    });
    
    it('saves store', function() {
      scope.saveStore();
      expect(identity.store.save).toHaveBeenCalled();
    });
  
});
});