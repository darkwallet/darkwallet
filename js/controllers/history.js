/**
 * @fileOverview HistoryCtrl angular controller
 */

function HistoryCtrl($scope) {
  $scope.balance = 0;
  $scope.pocketName = "All Pockets";
  $scope.selectPocket = function(pocket) {
      if (pocket === undefined) {
          $scope.pocketName = "All Pockets";
      } else {
          var pocketIndex = $scope.identity.wallet.pockets.indexOf(pocket);
          $scope.pocketName = pocket;
      }
      $scope.balance = $scope.identity.wallet.getBalance(pocket);
  }
}

