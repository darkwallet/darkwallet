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
  controllers.controller('NewWalletCtrl', ['$scope', '$location', function($scope, $location) {

  $scope.step = 1;
  $scope.form = {
    create_or_restore: 'create',
    network: 'bitcoin'
  };

  $scope.nextStep = function() {
    $scope.step++;
  };
  
  $scope.previousStep = function() {
    $scope.step--;
  };

  $scope.passwordSubmit = function() {
    // Check that passwords match.
    if ($scope.form.passwd != $scope.form.passwd2) {
      $scope.message = 'Passwords are not the same';
      return;
    }

    if ($scope.form.create_or_restore == 'create') {
      var mnemonic = new Mnemonic(128);
      $scope.form.mnemonic = mnemonic.toWords().join(' ');
      $scope.step++;
    } else {
      $scope.step += 2;
    }
  };

  $scope.mnemonicSubmit = function() {
    if ($scope.form.mnemonic && $scope.form.mnemonic != $scope.form.mnemonic2) {
      $scope.message2 = 'Mnemonics are not the same';
      return;
    }
    
    var words = $scope.form.mnemonic2.split(' ');
    var mnemonic = new Mnemonic(words);

    var walletService = DarkWallet.service.wallet;

    walletService.createIdentity($scope.form.name, $scope.form.network, mnemonic.toHex(), $scope.form.passwd, function() {
        $location.path('#dashboard');
    });
  }
}]);
});
