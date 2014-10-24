/**
 * @fileOverview SigningCtrl angular controller
 */
'use strict';

define(['angular-mocks', 'testUtils', 'bitcoinjs-lib'], function (mocks, testUtils, Bitcoin) {

  describe('Sign controller', function() {
    var signController, scope, DarkWallet, notify;

    var modals = {password: function(title, cb) {cb('pass');}};

    var testMsg = "-----BEGIN BITCOIN SIGNED MESSAGE-----\nAddress: 1GLHNLABipUJZ7tN2LDu85zxpxVVmswbhB\nHash: SHA256\n\ntest text\n-----BEGIN BITCOIN SIGNATURE-----\nVersion: GnuPG v1.4.12 (GNU/Linux)\n\nIEEwdj7/ZQLq8Ms1LNNeZPoQjloKdokpZ9B48aUKyr/JHQ1lP/vcqR2eoJuODpOR\nMzpCjBZ9KHNi3DguG1NsSKE=\n\n-----END BITCOIN SIGNATURE-----";
    var identity = {
      wallet: {
        getWalletAddress: function(address) {
          if (address == 'multisig') { 
              return {type: 'multisig'};
          } else {
              return {index: [1,2], address: address};
          }
        },
        getPrivateKey: function(seq, pass, cb) {cb(Bitcoin.ECKey.fromWIF("Kwi6e7qyemChBmPm1ySD8VR99eGNfE74iQDp8Q5PFKri6mgoUkFf"))},
      }
    };
    
    var injectController = function() {
      mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
        notify = {};
        scope = $rootScope.$new();
        notify.success = function() {};
        var _ = function(s) {
          return s;
        };
        signController = $controller('SigningCtrl', {$scope: scope, notify: notify, _Filter: _, modals: modals});
      }]);
    };
    
    beforeEach(function(done) {
      window.chrome = {runtime: {}};
      testUtils.stub('darkwallet', {
        service: {
          wallet: { 
            mixTransaction: function() {}
          }
        },
        getIdentity: function() {
          return identity;
        }
      });

      mocks.module("DarkWallet.controllers");
      
      testUtils.loadWithCurrentStubs('frontend/controllers/signing', function() {
        injectController();
        DarkWallet = require('darkwallet');
        //spyOn(identity.contacts, 'deleteContact');
        done();
      });
    });
    
    afterEach(function() {
      testUtils.reset();
      delete window.chrome;
    });

    describe('', function() {

      it('signs a text properly', function() {
         scope.tools = {};
         scope.tools.signText = "test text";
         scope.tools.signAddress = "1GLHNLABipUJZ7tN2LDu85zxpxVVmswbhB";
         scope.signText()
         expect(scope.tools.status).toBe('ok');
         expect(scope.tools.signOpen).toBe(false);
         expect(scope.tools.open).toBe(false);
         expect(scope.tools.output).toBe(testMsg);
      });

      it('signs with a multisig address', function() {
         var called = false;
         notify.warning = function() { called = true; };
         scope.tools = {};
         scope.tools.signText = "test text";
         scope.tools.signAddress = "multisig";
         scope.signText()
         expect(called).toBe(true);
      });

      it('verifies a text properly', function() {
         scope.tools = {};
         scope.tools.verifyText = testMsg;
         scope.verifyText()
         expect(scope.tools.status).toBe('signature ok by 1GLHNLABipUJZ7tN2LDu85zxpxVVmswbhB');
         expect(scope.verifyOpen).toBe(false);
         expect(scope.tools.open).toBe(false);
         expect(scope.tools.output).toBe('');
      });

      it('verifies a text properly with separate address and signature', function() {
         scope.tools = {};
         scope.tools.verifyText = "test text";
         scope.tools.verifySig = "IEEwdj7/ZQLq8Ms1LNNeZPoQjloKdokpZ9B48aUKyr/JHQ1lP/vcqR2eoJuODpORMzpCjBZ9KHNi3DguG1NsSKE=";
         scope.tools.verifyAddress = "1GLHNLABipUJZ7tN2LDu85zxpxVVmswbhB";
         scope.verifyText()
         expect(scope.tools.status).toBe('signature ok by 1GLHNLABipUJZ7tN2LDu85zxpxVVmswbhB');
         expect(scope.verifyOpen).toBe(false);
         expect(scope.tools.open).toBe(false);
         expect(scope.tools.output).toBe('');
      });

      it('invalid signature', function() {
         var called = false;
         notify.warning = function() { called = true; };
         scope.tools = {};
         scope.tools.verifyText = "test text";
         scope.tools.verifySig = "IEEwdj7/ZQLq8Ms1LNNeZPoQjloKd11pZ9B48aUKyr/JHQ1aP/vcqR2eoJuODpORMzpCjBZ9KHNi3DguG1NsSKE=";
         scope.tools.verifyAddress = "1GLHNLABipUJZ7tN2LDu85zxpxVVmswbhB";
         scope.verifyText()
         expect(scope.tools.status).toBe('invalid signature');
         expect(scope.verifyOpen).toBe(false);
         expect(scope.tools.open).toBe(false);
         expect(scope.tools.output).toBe('');
         expect(called).toBe(true);
      });

      it('bad text', function() {
         var called = false;
         notify.error = function() { called = true; };
         scope.tools = {};
         scope.tools.verifyText = "foo";
         scope.verifyText()
         expect(called).toBe(true);
      });


    });
  });
});
