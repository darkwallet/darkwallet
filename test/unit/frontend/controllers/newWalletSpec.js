/**
 * @file New Wallet Angular Tricks
 */
'use strict';

define(['angular-mocks', 'testUtils'],
function (mocks, testUtils) {
  describe('New wallet controller', function() {

    var newWalletCtrl, scope, $window, DarkWallet, pars = {};

    beforeEach(function (done) {
      testUtils.stub('darkwallet', {
        service: {
          wallet: {
            createIdentity: function(name, secret, password, callback) {
                pars.name = name;
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
          scope = $rootScope.$new();
          $window = {};
          newWalletCtrl = $controller('NewWalletCtrl', {$scope: scope, $window: $window});
          done();
        }]);
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    });
    
    it('is initialized properly', function() {
      expect(scope.activeForm).toBe('password');
      expect(scope.create_or_restore).toBe('create');
    });
    
    it('shows mnemonic form on password one is submitted', function() {
      scope.passwd = 'p4ssw0rd';
      scope.passwd2 = 'p4ssw0rd';
      scope.passwordSubmit();
      expect(scope.activeForm).toBe('mnemonic');
      expect(scope.mnemonicWords.split(' ').length).toBe(12);
      expect(scope.message).toBeUndefined();
    });
    
    it('do not show next form if passwords doesn\'t match', function() {
      scope.passwd = 'p4ssw0rd';
      scope.passwd2 = 'doesntmatch';
      scope.passwordSubmit();
      scope.create_or_restore = 'restore';
      scope.passwordSubmit();
      expect(scope.activeForm).toBe('password');
      expect(scope.message).toBeDefined();
    });
    
    it('directly shows confirm mnemonic form if restore is marked in password form', function() {
      scope.passwd = 'p4ssw0rd';
      scope.passwd2 = 'p4ssw0rd';
      scope.create_or_restore = 'restore';
      scope.passwordSubmit();
      expect(scope.activeForm).toBe('mnemonic2');
      expect(scope.mnemonicWords).toBeUndefined();
    });
    
    it('makes mnemonic form go to the confirm mnemonic form', function() {
      scope.mnemonicSubmit();
      expect(scope.activeForm).toBe('mnemonic2');
    });
    
    it('displays an error if mnemonics does not match on confirm mnemonic', function() {
      scope.mnemonicWords = "foo bar baz qux";
      scope.mnemonic2Submit();
      expect(scope.message2).toBeDefined();
    });
    
    it('generates a new identity when a mnemonic is provided', function() {
      scope.name = 'Satoshi';
      scope.passwd = 'p4ssw0rd';
      scope.mnemonic2Words = "king government grown apologize bowl precious eternal ceiling satisfy just silently control";
      scope.mnemonic2Submit();

      expect($window.location).toBe('#dashboard');

      expect(scope.message2).toBeUndefined();

      expect(pars.name).toBe(scope.name);
      expect(pars.secret).toBe('be21b135c24c58c0fd72182db940af8d');
      expect(pars.password).toBe(scope.passwd);
    });
  });
});
