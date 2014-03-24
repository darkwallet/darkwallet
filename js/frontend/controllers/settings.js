define(['./module', 'darkwallet', 'util/fiat'], function (controllers, DarkWallet, FiatCurrencies) {
  'use strict';

  // Controller
  controllers.controller('WalletSettingsCtrl', ['$scope', function($scope) {
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
