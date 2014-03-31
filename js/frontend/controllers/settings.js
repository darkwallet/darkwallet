define(['./module', 'darkwallet', 'util/fiat'], function (controllers, DarkWallet, FiatCurrencies) {
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
}]);
});
