/**
 * @file New Wallet Angular Tricks
 */
'use strict';

define(['angular-mocks', 'testUtils'],
function (mocks, testUtils) {
  describe('New wallet controller', function() {

    var newWalletCtrl, scope, $location, _location, DarkWallet, pars = {};

    beforeEach(function (done) {
      testUtils.stub('darkwallet', {
        service: {
          wallet: {
            createIdentity: function(name, network, secret, password, callback) {
                pars.name = name;
                pars.network = network;
                pars.secret = secret;
                pars.password = password;
                callback();
            }
          }
        }
      });
    
      testUtils.loadWithCurrentStubs('frontend/controllers/new_wallet', function() {
        DarkWallet = require('darkwallet');
        mocks.module("DarkWallet.controllers");
        mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
          var notify = {
            success: function(){},
            warning: function(){},
            error: function(){}
          };
          scope = $rootScope.$new();
          $location = {path: function(location){
              _location = location;
          }};
          newWalletCtrl = $controller('NewWalletCtrl', {$scope: scope, $location: $location, notify: notify});
          done();
        }]);
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    });
    
    it('is initialized properly', function() {
      expect(scope.step).toBe(1);
      expect(scope.form.create_or_restore).toBe('create');
      expect(scope.form.network).toBe('bitcoin');
    });
    
    it('goes to the next step of the form', function() {
      scope.nextStep();
      expect(scope.step).toBe(2);
    });
    
    it('shows mnemonic form on password one is submitted', function() {
      scope.form.passwd = 'p4ssw0rd';
      scope.form.passwd2 = 'p4ssw0rd';
      scope.step = 3;
      scope.passwordSubmit();
      expect(scope.step).toBe(4);
      expect(scope.form.mnemonic.split(' ').length).toBe(12);
      expect(scope.message).toBeUndefined();
    });
    
    it('do not show next form if passwords doesn\'t match', function() {
      scope.form.passwd = 'p4ssw0rd';
      scope.form.passwd2 = 'doesntmatch';
      scope.passwordSubmit();
      scope.form.create_or_restore = 'restore';
      scope.step = 2;
      scope.passwordSubmit();
      expect(scope.step).toBe(2);
      expect(scope.message).toBeDefined();
    });
    
    it('directly shows confirm mnemonic form if restore is marked in password form', function() {
      scope.form.passwd = 'p4ssw0rd';
      scope.form.passwd2 = 'p4ssw0rd';
      scope.form.create_or_restore = 'restore';
      scope.step = 3;
      scope.passwordSubmit();
      expect(scope.step).toBe(5);
      expect(scope.form.mnemonic).toBeUndefined();
    });
    
    it('displays an error if mnemonics does not match on confirm mnemonic', function() {
      scope.form.mnemonic = "foo bar baz qux";
      scope.mnemonicSubmit();
      expect(scope.message2).toBeDefined();
    });
    
    it('generates a new identity when a mnemonic is provided', function() {
      scope.form.name = 'Satoshi';
      scope.form.passwd = 'p4ssw0rd';
      scope.form.mnemonic2 = "king government grown apologize bowl precious eternal ceiling satisfy just silently control";
      scope.mnemonicSubmit();

      expect(_location).toBe('#dashboard');

      expect(scope.message2).toBeUndefined();

      expect(pars.name).toBe(scope.form.name);
      expect(pars.network).toBe(scope.form.network);
      expect(pars.secret).toBe('be21b135c24c58c0fd72182db940af8d');
      expect(pars.password).toBe(scope.form.passwd);
    });
  });
});
