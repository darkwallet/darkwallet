function WalletSettingsCtrl($scope) {
  $scope.clearStorage = function() {
      var keyRing = DarkWallet.getKeyRing();
      keyRing.clear();
  }
}
