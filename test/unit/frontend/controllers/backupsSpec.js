'use strict';

define(['angular-mocks', 'testUtils'], function (mocks, testUtils) {

describe('Backup controller', function() {
    
    var backupController, scope, window, notify, modals, identity, keyring, element;
    
    beforeEach(function(done) {

      identity = {
        store: {
          save: function() {}
        }
      };
      spyOn(identity.store, 'save');
      
      keyring = {
        getRaw: function(name, callback) {
          callback({});
        }
      };
      
      element = {
        addEventListener: function() {},
        setAttribute: function() {},
        click:function() {},
        files: []
      };
      spyOn(element, 'addEventListener').and.callFake(function(name, callback) {
        element.change = callback;
      });
      spyOn(element, 'setAttribute');
      spyOn(element, 'click');

      testUtils.stub('darkwallet', {
        getIdentity: function() {
          return identity;
        },
        getKeyRing: function() {
          return keyring;
        }
      });
      
      testUtils.loadWithCurrentStubs('frontend/controllers/backups', function(loadedModule) {
        mocks.module("DarkWallet.controllers");
        mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
          scope = $rootScope.$new();
          window = {
            document: {
              getElementById: function() {
                return element;
              },
              createElement: function() {
                return element;
              }
            }
          };
          notify = {
            success: function() {}
          };
          modals = {
            openModal: function(name, vars, callback) {
              callback('p4ssw0rd');
            }
          };
          var _ = function(s) {
            return s;
          }
          backupController = $controller('BackupsCtrl', {
            $scope: scope,
            $window: window,
            notify: notify,
            modals: modals,
            _Filter: _
          });
          done();
        }]);
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    });
    
    it('is created properly', function() {
      expect(scope.importFile).toEqual({});
      expect(element.addEventListener).toHaveBeenCalled();
    });
    
    xit('backs up an identity', function() {
      scope.backupIdentity('Satoshi');
    });
    
    xit('handles file select', function() {
      element.change();
    });
    
    xit('loads backup', function() {
      scope.loadBackup(''); // Not loading yet
    });
    
    xit('unlocks backup', function() {
      scope.unlockBackup();
    });
    
    xit('restores backup', function() {
      scope.restoreBackup();
    });
});
});