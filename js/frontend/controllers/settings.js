define(['./module', 'darkwallet', 'util/fiat', 'mnemonicjs'], function (controllers, DarkWallet, FiatCurrencies,  Mnemonic) {
  'use strict';

  // Controller
  controllers.controller('WalletSettingsCtrl', ['$scope', 'toaster', function($scope, toaster) {
  var identity = DarkWallet.getIdentity();

  // Available fiat currencies
  $scope.fiatCurrencies = FiatCurrencies;
  $scope.selectedCurrency = identity.settings.currency;
  $scope.selectedFiat = identity.settings.fiatCurrency;

  // Clear the local storage
  $scope.clearStorage = function() {
      var keyRing = DarkWallet.getKeyRing();
      keyRing.clear();
      toaster.pop('note', 'Storage cleared, please restart your browser.');
  }
  
  $scope.clearTasks = function() {
      var identity = DarkWallet.getIdentity();
      identity.tasks.clear();
      toaster.pop('note', 'Tasks cleared.');
  }
  
  $scope.passwordChanged = function() {
      if ($scope.newPassword === $scope.newPasswordRepeat) {
          var identity = DarkWallet.getIdentity();
          var success = identity.changePassword($scope.oldPassword, $scope.newPassword);
          if (success) {
              identity.store.save();
              toaster.pop('note', 'Password changed');
              $scope.oldPassword = $scope.newPassword = $scope.newPasswordRepeat = '';
              $scope.incorrectPassword = false;
          } else {
              $scope.incorrectPassword = true;
          }
      }
  }

  // Callback for saving the selected currency
  $scope.currencyChanged = function() {
      var identity = DarkWallet.getIdentity();
      identity.settings.currency = $scope.selectedCurrency;
      identity.store.save();
  }
  $scope.fiatCurrencyChanged = function() {
      var identity = DarkWallet.getIdentity();
      var walletService = DarkWallet.service().getWalletService();
      identity.settings.fiatCurrency = $scope.selectedFiat;
      walletService.setFiatCurrency($scope.selectedFiat);
      identity.store.save();
  }
  $scope.defaultFeeChanged = function() {
      var identity = DarkWallet.getIdentity();
      if (!isNaN($scope.defaultFee)) {
          identity.wallet.setDefaultFee($scope.defaultFee*100000000);
      }
  }
  $scope.showSeed = function(){
      var current_password = $scope.seedPassword; 
      var identity = DarkWallet.getIdentity();
      var private_data = identity.store.getPrivateData(current_password);
      var seed = private_data.seed;
      var random = [];
      for(var i=0;i<seed.length/8;i++){
        var integer = parseInt(seed.slice(8*i,i*8+8),16);
        random.push(integer);
      }
      var m  = new Mnemonic();
      m.random = random;

      $scope.yourSeed = true;
      $scope.yourSeedHex = seed;
      $scope.yourSeedWords = m.toWords().join(' ');
  }
}]);
});
