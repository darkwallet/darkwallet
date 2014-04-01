/**
 * @fileOverview CalculatorCtrl angular controller
 */

define(['./module', 'darkwallet', 'frontend/services', 'util/fiat'], function (controllers, DarkWallet, Services, FiatCurrencies) {
  'use strict';
  controllers.controller('CalculatorCtrl', ['$scope', function($scope) {
  var firstTime = true;
  var walletService = DarkWallet.service().getWalletService();
  $scope.calculator = {
     amount: 1,
     converted: 0,
     amountFocused: false,
     convertedFocused: false
  };

  // Set the currency icon
  var initCurrencyIcon = function() {
    var identity = DarkWallet.getIdentity();
    $scope.selectedCurrency = identity.settings.currency;
    var fiat = identity.settings.fiatCurrency;
    $scope.fiatSymbol = FiatCurrencies[fiat].symbol_native;
  }

  // Wallet service, connect to get notified about identity getting loaded.
  Services.connectNg('wallet', $scope, function(data) {
    if (data.type == 'ready') {
      initCurrencyIcon();
    }
  });

  // Convert CRYPTO to FIAT
  $scope.$watch('calculator.amount', function() {
    var identity = DarkWallet.getIdentity();
    var walletService = DarkWallet.service().getWalletService();
    var currency = identity.settings.currency;
    var fiatCurrency = identity.settings.fiatCurrency;

    if (!firstTime && !$scope.calculator.amountFocused) {
        return;
    }
    firstTime = false;
    if (!walletService.rates.hasOwnProperty(identity.settings.fiatCurrency)) {
        $scope.calculator.converted = 'no rates';
        return;
    }
    $scope.calculator.converted = walletService.btcToFiat($scope.calculator.amount, currency, fiatCurrency);
  });

  // Convert FIAT to CRYPTO
  $scope.$watch('calculator.converted', function() {
    var identity = DarkWallet.getIdentity();
    var walletService = DarkWallet.service().getWalletService();
    var currency = identity.settings.currency;
    var fiatCurrency = identity.settings.fiatCurrency;

    if (!$scope.calculator.convertedFocused) {
        return;
    }
    if (!walletService.rates.hasOwnProperty(identity.settings.fiatCurrency)) {
        return;
    }
    $scope.calculator.amount = walletService.fiatToBtc($scope.calculator.converted, currency, fiatCurrency);
  });

}]);
});
