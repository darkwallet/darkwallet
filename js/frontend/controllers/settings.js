define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  'use strict';
  controllers.controller('WalletSettingsCtrl', ['$scope', function($scope) {

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
}]);
});
