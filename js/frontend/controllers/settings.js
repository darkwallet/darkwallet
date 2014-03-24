define(['./module', 'darkwallet', 'util/fiat'], function (controllers, DarkWallet, FiatCurrencies) {
  'use strict';

  // Controller
  controllers.controller('WalletSettingsCtrl', ['$scope', function($scope) {

  // Available fiat currencies
  $scope.fiatCurrencies = FiatCurrencies;

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
}]);
});
