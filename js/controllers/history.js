/**
 * @fileOverview HistoryCtrl angular controller
 */

function HistoryCtrl($scope) {
  $scope.balance = 0;
  $scope.pocketName = "All Pockets";
  $scope.pocket = {index: undefined, name: 'All Pockets', mpk: undefined};
  $scope.selectPocket = function(pocket) {
      if (pocket === undefined) {
          $scope.pocket.name = "All Pockets";
          $scope.pocket.index = undefined;
      } else {
          $scope.pocket.index = $scope.identity.wallet.pockets.indexOf(pocket);
          $scope.pocket.name = pocket;
          // derive mpk here for now so we can show as master address
          // this is a bit slow and key should be cached...
	  var mpKey = new Bitcoin.BIP32key($scope.identity.wallet.mpk);
          var childKey = mpKey.ckd($scope.pocket.index);
          $scope.pocket.mpk = childKey.getPub().serialize().substring(0,64)+'...';
      }
      $scope.balance = $scope.identity.wallet.getBalance(pocket);
  }
}

