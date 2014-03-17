define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  'use strict';
  controllers.controller('WalletSettingsCtrl', ['$scope', function($scope) {
  $scope.clearStorage = function() {
      var keyRing = DarkWallet.getKeyRing();
      keyRing.clear();
  }
}]);
});