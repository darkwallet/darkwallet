/**
 * @fileOverview CalculatorCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port', 'util/fiat', 'dwutil/currencyformat'], function (controllers, DarkWallet, Port, FiatCurrencies, CurrencyFormat) {
  controllers.controller('CalculatorCtrl', ['$scope', '_Filter', function($scope, _) {
  var firstTime = true;
  $scope.calculator = {
     amount: 1,
     converted: 0,
     amountFocused: false,
     convertedFocused: false
  };

  // Set the currency icon
  var initCurrencyIcon = function() {
    var identity = DarkWallet.getIdentity();
    $scope.settings = identity.settings;
    var fiat = $scope.settings.fiatCurrency;
    $scope.fiatSymbol = FiatCurrencies[fiat].symbol_native;
  };

  // Wallet service, connect to get notified about identity getting loaded.
  Port.connectNg('wallet', $scope, function(data) {
    if (data.type == 'ready') {
      initCurrencyIcon();
    }
  });

  // Convert CRYPTO to FIAT
  $scope.$watch('calculator.amount', function() {
    var tickerService = DarkWallet.service.ticker;
    var currency = $scope.settings.currency;
    var fiatCurrency = $scope.settings.fiatCurrency;

    if (!firstTime && !$scope.calculator.amountFocused) {
        return;
    }
    firstTime = false;
    if (!tickerService.rates.hasOwnProperty(fiatCurrency)) {
        $scope.calculator.converted = _('no rates');
        return;
    }
    $scope.calculator.converted = CurrencyFormat.btcToFiat($scope.calculator.amount, currency, fiatCurrency);
  });

  // Convert FIAT to CRYPTO
  $scope.$watch('calculator.converted', function() {
    var tickerService = DarkWallet.service.ticker;
    var currency = $scope.settings.currency;
    var fiatCurrency = $scope.settings.fiatCurrency;

    if (!$scope.calculator.convertedFocused) {
        return;
    }
    if (!tickerService.rates.hasOwnProperty(fiatCurrency)) {
        return;
    }
    $scope.calculator.amount = CurrencyFormat.fiatToBtc($scope.calculator.converted, currency, fiatCurrency);
  });

}]);
});
