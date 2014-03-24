/**
 * @fileOverview HistoryCtrl angular controller
 */

define(['./module', 'bitcoinjs-lib'], function (controllers, Bitcoin) {
  'use strict';
  controllers.controller('HistoryCtrl', ['$scope', '$timeout', 'toaster', function($scope, $timeout, toaster) {

  // History
  
  $scope.pocketName = "All Pockets";
  $scope.selectedPocket = 'pocket:all';
  $scope.pocket = {index: undefined, name: 'All Pockets', mpk: undefined, addresses: $scope.allAddresses, changeAddresses: []};
  $scope.isAll = true;
  $scope.isFund = false;
  $scope.selectFund = function(fund, rowIndex) {
      $scope.pocket.name = fund.name;
      $scope.pocket.index = 'fund'
      $scope.pocket.addresses = [$scope.identity.wallet.getAddress(fund.seq)]
      $scope.pocket.changeAddresses = [];
      $scope.pocket.fund = fund;
      $scope.isAll = false;
      $scope.isFund = true;
      $scope.pocket.mpk = undefined;
      $scope.pocket.stealth = undefined;
      $scope.selectedPocket = 'fund:' + rowIndex;
      $scope.balance = $scope.identity.wallet.getAddress(fund.seq).balance;
  }
  $scope.selectPocket = function(pocketName, rowIndex) {
      var pocketIndex;
      if (pocketName === undefined) {
          $scope.pocket.name = "All Pockets";
          $scope.pocket.index = undefined;
          $scope.pocket.mpk = undefined;
          $scope.pocket.stealth = undefined;
          $scope.pocket.fund = null;
          $scope.pocket.addresses = $scope.allAddresses;
          $scope.pocket.changeAddresses = [];
          $scope.isAll = true;
          $scope.isFund = false;
          $scope.balance = $scope.identity.wallet.getBalance()
          rowIndex = 'all';
      } else {
          pocketIndex = rowIndex*2;
          $scope.pocket.index = pocketIndex;
          $scope.pocket.name = pocketName;
          $scope.pocket.fund = null;
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
          $scope.pocket.changeAddresses = $scope.addresses[$scope.pocket.index+1];
          $scope.isAll = false;
          $scope.isFund = false;
          // balance is sum of public and change branches
          $scope.balance = $scope.identity.wallet.getBalance(pocketIndex)+$scope.identity.wallet.getBalance(pocketIndex+1);
      }
      $scope.selectedPocket = 'pocket:' + rowIndex;
  }

  // Pockets
  $scope.newPocketName = '';
  $scope.creatingPocket = false;
  $scope.createPocket = function() {
    if ($scope.creatingPocket) {
      if ($scope.newPocketName) {
          // create pocket
          $scope.identity.wallet.createPocket($scope.newPocketName);
          // initialize pocket on angular
          $scope.initPocket($scope.identity.wallet.pockets.length-1);
          // generate an address
          $scope.generateAddress($scope.identity.wallet.pockets.length-1, 0);
          // select the pocket
          $scope.selectPocket($scope.newPocketName, $scope.identity.wallet.pockets.length-1);
          // reset pocket form
          $scope.newPocketName = '';
      }
    } else {
      // wait a bit since we can't focus till the element is shown
      $timeout(function() {
        document.getElementById('pocketNameInput').focus()
      });
    }
    $scope.creatingPocket = !$scope.creatingPocket;
  }


}]);
});
