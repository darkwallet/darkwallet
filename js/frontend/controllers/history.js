/**
 * @fileOverview HistoryCtrl angular controller
 */

define(['./module', 'bitcoinjs-lib', 'util/btc', 'frontend/services'], function (controllers, Bitcoin, BtcUtils, Services) {
  'use strict';
  controllers.controller('HistoryCtrl', ['$scope', 'toaster', function($scope, toaster) {

  // Start some structures
  $scope.pocket = {index: undefined, name: 'All Pockets', mpk: undefined, addresses: $scope.allAddresses, changeAddresses: []};
  $scope.pocketName = "All Pockets";
  $scope.selectedPocket = 'pocket:all';

  $scope.isAll = true;
  $scope.isFund = false;


  // History Listing
  $scope.selectFund = function(fund, rowIndex) {
      $scope.pocket.name = fund.name;
      $scope.pocket.index = fund.seq[0];
      var address = $scope.identity.wallet.getAddress(fund.seq)
      $scope.pocket.changeAddresses = [];
      $scope.pocket.addresses = [address];
      console.log($scope.identity.wallet)
      console.log("select fund", $scope.pocket.addresses, fund.seq, address);
      $scope.pocket.fund = fund;
      $scope.isAll = false;
      $scope.isFund = true;
      $scope.pocket.mpk = undefined;
      $scope.pocket.stealth = undefined;
      $scope.selectedPocket = 'fund:' + rowIndex;
      $scope.balance = $scope.identity.wallet.getAddress(fund.seq).balance;
      //balanceStart($scope.balance);
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
          //balanceStart($scope.balance);
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
  
  $scope.pocketNewName = '';
  $scope.renamingPocket = false;
  $scope.renamePocket = function(oldName, newName) {
    if ($scope.renamingPocket) {
      if (newName) {
        $scope.identity.wallet.renamePocket(oldName, newName);
        $scope.pocket.name = newName;
      }
      $scope.renamingPocket = null;
    } else {
      $scope.renamingPocket = oldName;
      $scope.pocketNewName = oldName;
    }
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
    }
    $scope.creatingPocket = !$scope.creatingPocket;
  }

  // Filters
  var shownRows = [];

  $scope.txFilter = 'last10';

  var pocketFilter = function(row) {
      if ($scope.isAll) {
          // only add pocket transactions for now
          return typeof row.pocket === 'number';
      }
      else {
          return row.pocket == $scope.pocket.index;
      }
  }

  // Get date 30 days ago
  var prevmonth = new Date();
  prevmonth.setDate(prevmonth.getDate()-30)
  // Get date 7 days ago
  var prevweek = new Date();
  prevweek.setDate(prevweek.getDate()-7)

  // Set the history filter
  $scope.setHistoryFilter = function(name) {
      $scope.txFilter = name;
  }

  // History filter, run for every row to see if we should show it
  $scope.unusedAddressFilter = function(address) {
      return address.nOutputs == 0;
  }
  $scope.usedAddressFilter = function(address) {
      return address.nOutputs;
  }
  $scope.historyFilter = function(row) {
      if (pocketFilter(row)) {
          switch($scope.txFilter) {
              case 'all':
                  return true;
              case 'lastWeek':
                  var ts = BtcUtils.heightToTimestamp(row.height);
                  if (ts > prevweek.getTime()) {
                      return true;
                  }
                  break;
              case 'lastMonth':
                  var ts = BtcUtils.heightToTimestamp(row.height);
                  if (ts > prevmonth.getTime()) {
                      return true;
                  }
                  break;
              case 'last10':
              default:
                  if (shownRows.indexOf(row.hash) != -1) {
                      return true;
                  } else if (shownRows.length < 10) {
                      shownRows.push(row.hash)
                      return true;
                  }
          }
      }
      return false;
  }


}]);
});
