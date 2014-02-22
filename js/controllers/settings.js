function WalletSettingsCtrl($scope) {
  var keyRing = DarkWallet.keyRing;

  $scope.clearStorage = function() {
      keyRing.clear();
  }
}
