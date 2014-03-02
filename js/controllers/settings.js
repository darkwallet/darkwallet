angular.module('DarkWallet.controllers').controller('WalletSettingsCtrl', ['$scope', function($scope) {
  $scope.clearStorage = function() {
      var keyRing = DarkWallet.getKeyRing();
      keyRing.clear();
  }
}]);