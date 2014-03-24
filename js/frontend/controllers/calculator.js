/**
 * @fileOverview CalculatorCtrl angular controller
 */

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
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

  // Convert CRYPTO to FIAT
  $scope.$watch('calculator.amount', function() {
    if (!firstTime && !$scope.calculator.amountFocused) {
        return;
    }
    firstTime = false;
    if (!walletService.rates.hasOwnProperty(walletService.currency)) {
        $scope.calculator.converted = 'no rates';
        return;
    }
    var result = $scope.calculator.amount*walletService.rates[walletService.currency];
    if (isNaN(result)) {
        $scope.calculator.converted = '';
    } else {
        $scope.calculator.converted = result.toFixed(2);
    }
  });

  // Convert FIAT to CRYPTO
  $scope.$watch('calculator.converted', function() {
    if (!$scope.calculator.convertedFocused) {
        return;
    }
    if (!walletService.rates.hasOwnProperty(walletService.currency)) {
        return;
    }
    var result = $scope.calculator.converted/walletService.rates[walletService.currency];
    if (isNaN(result)) {
        $scope.calculator.amount = '';
    } else {
        $scope.calculator.amount = result.toFixed(8);
    }
  });

}]);
});
