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
      identity.settings.currency = $scope.selectedCurrency;
      identity.store.save();
  }
  $scope.fiatCurrencyChanged = function() {
      var walletService = DarkWallet.service().getWalletService();
      identity.settings.fiatCurrency = $scope.selectedFiat;
      walletService.setFiatCurrency($scope.selectedFiat);
      identity.store.save();
  }
  $scope.defaultFeeChanged = function() {
      if (!isNaN($scope.defaultFee)) {
          identity.wallet.setDefaultFee($scope.defaultFee*100000000);
      }
  }
}]);
});
