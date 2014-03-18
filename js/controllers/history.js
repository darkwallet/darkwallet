/**
 * @fileOverview HistoryCtrl angular controller
 */

define(['./module', 'bitcoinjs-lib'], function (controllers, Bitcoin) {
  'use strict';
  controllers.controller('HistoryCtrl', ['$scope', '$timeout', function($scope, $timeout) {

  // History
  
  $scope.pocketName = "All Pockets";
  $scope.pocket = {index: undefined, name: 'All Pockets', mpk: undefined, addresses: $scope.allAddresses};
  $scope.isAll = true;
  $scope.selectPocket = function(pocket, pocketIndex) {
      if (pocket === undefined) {
          $scope.pocket.name = "All Pockets";
          $scope.pocket.index = undefined;
          $scope.pocket.mpk = undefined;
          $scope.pocket.stealth = undefined;
          $scope.pocket.addresses = $scope.allAddresses;
          $scope.isAll = true;
      } else {
          $scope.pocket.index = $scope.identity.wallet.pockets.indexOf(pocket);
          $scope.pocket.name = pocket;
          var walletAddress = $scope.identity.wallet.getAddress([$scope.pocket.index]);
          if (!walletAddress.mpk) {
              // derive mpk here for now so we can show as master address
	      var mpKey = Bitcoin.HDWallet.fromBase58($scope.identity.wallet.mpk);
              var childKey = mpKey.derive($scope.pocket.index);
              walletAddress.mpk = childKey.toBase58(false);
              $scope.identity.wallet.store.save();
          }
          $scope.pocket.mpk = walletAddress.mpk;
          $scope.pocket.stealth = walletAddress.stealth;
          $scope.pocket.addresses = $scope.addresses[$scope.pocket.index];
          $scope.isAll = false;
      }
      $scope.selectedPocket = pocketIndex;
      $scope.balance = $scope.identity.wallet.getBalance(pocket);
  };

  // Pockets
  $scope.newPocketName = '';
  $scope.creatingPocket = false;
  $scope.createPocket = function() {
    if ($scope.creatingPocket) {
      if ($scope.newPocketName) {
          $scope.identity.wallet.createPocket($scope.newPocketName);
          $scope.identity.wallet.createPocket($scope.newPocketName+'-change');
          $scope.selectPocket($scope.newPocketName, $scope.identity.wallet.pockets.length-2);
          $scope.newPocketName = '';
      }
    } else {
      // wait a bit since we can't focus till the element is shown
      $timeout(function() {
        document.getElementById('pocketNameInput').focus();
      });
    }
    $scope.creatingPocket = !$scope.creatingPocket;
  };


}]);
});
