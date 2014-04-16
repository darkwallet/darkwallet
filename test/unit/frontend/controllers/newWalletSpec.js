
/**
 * @file New Wallet Angular Tricks
 */

define(['angular-mocks', 'frontend/controllers/new_wallet', 'darkwallet'],
function (mocks, NewWalletCtrl, DarkWallet) {
  'use strict';
  describe('New wallet controller', function() {

    var newWalletCtrl, scope, $window;

    beforeEach(function () {
      mocks.module("DarkWallet.controllers");

      mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
          scope = $rootScope.$new();
          $window = {};
          newWalletCtrl = $controller('NewWalletCtrl', {$scope: scope, $window: $window});
      }]);
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
      expect(DarkWallet._createIdentityResult).toEqual({
        name: 'Satoshi',
        seed_length: 32,
        password: 'p4ssw0rd'
      });
      expect($window.location).toBe('index.html');
      expect(scope.message2).toBeUndefined();
    });
  });
});
