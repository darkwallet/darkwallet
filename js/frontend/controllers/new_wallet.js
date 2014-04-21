/**
 * @file New Wallet Angular Tricks
 */
'use strict';


/**
 * Password class constructor.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['./module', 'darkwallet', 'mnemonicjs'], function (controllers, DarkWallet, Mnemonic) {
  controllers.controller('NewWalletCtrl', ['$scope', '$window', function($scope, $window) {

  $scope.activeForm = 'password';
  $scope.create_or_restore = 'create';

  $scope.passwordSubmit = function() {

    // Check that passwords match.
    if ($scope.passwd != $scope.passwd2) {
      $scope.message = 'Passwords are not the same';
      $scope.pubKey = '';
      $scope.privKey = '';
      return;
    }

    if ($scope.create_or_restore == 'create') {
      var mnemonic = new Mnemonic(128);
      $scope.mnemonicWords = mnemonic.toWords().join(' ');
      $scope.activeForm = 'mnemonic';
    } else {
      $scope.activeForm = 'mnemonic2';
    }
  };
  
  $scope.mnemonicSubmit = function() {
    $scope.activeForm = 'mnemonic2';
  };

  $scope.mnemonic2Submit = function() {
    if ($scope.mnemonicWords && $scope.mnemonicWords != $scope.mnemonic2Words) {
      $scope.message2 = 'Mnemonics are not the same';
      return;
    }
    
    var words = $scope.mnemonic2Words.split(' ');
    var mnemonic = new Mnemonic(words);

    var walletService = DarkWallet.service.wallet;

    var identity = walletService.createIdentity($scope.name, mnemonic.toHex(), $scope.passwd, function() {
        $window.location = '#dashboard';
    });
  }
}]);
});
