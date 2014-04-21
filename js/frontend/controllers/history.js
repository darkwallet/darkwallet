/**
 * @fileOverview HistoryCtrl angular controller
 */
'use strict';

define(['./module', 'angular', 'bitcoinjs-lib', 'util/btc', 'darkwallet', 'dwutil/multisig', 'frontend/port'],
function (controllers, Angular, Bitcoin, BtcUtils, DarkWallet, MultisigFund, Port) {
  controllers.controller('HistoryCtrl', ['$scope', 'notify', '$window', function($scope, notify, $window) {

  // Start some structures
  $scope.pocket = {index: undefined, name: 'All Pockets', mpk: undefined, addresses: $scope.allAddresses, changeAddresses: []};
  $scope.pocketName = "All Pockets";
  $scope.selectedPocket = 'pocket:all';
  $scope.historyRows = [];

  $scope.tabs = {};

  $scope.isAll = true;
  $scope.isFund = false;
  
  /**
   * Balance
   */ 
  function calculateBalance(pocket, isFund, isAll) {
        var balance;
        var wallet = DarkWallet.getIdentity().wallet;
        if (isFund) {
            balance = wallet.getBalance(pocket.fund.multisig.seq[0]);
        } else if (isAll) {
            balance = wallet.getBalance();
        } else {
            var mainBalance = wallet.getBalance(pocket.index);
            var changeBalance = wallet.getBalance(pocket.index+1);

            var confirmed = mainBalance.confirmed + changeBalance.confirmed;
            var unconfirmed = mainBalance.unconfirmed + changeBalance.unconfirmed;
            balance = {confirmed: confirmed, unconfirmed: unconfirmed};
        }
        return balance;
  }


  /**
   * Pocket change
   */ 
  function isCurrentPocket(pocketId) {
      if ($scope.isAll) {
          return true;
      } else if ($scope.isFund && $scope.pocket.index == pocketId) {
          return true;
      } else if (typeof $scope.pocket.index == 'number' && pocketId == $scope.pocket.index/2) {
      }
  }

  function onBalanceUpdate() {
      var balance = calculateBalance($scope.pocket, $scope.isFund, $scope.isAll);
      $scope.balance = balance.confirmed;
      $scope.unconfirmed = balance.unconfirmed;
      $scope.chooseRows();
      if (!$scope.$$phase) {
          $scope.$apply();
      }
  }

  Port.connectNg('gui', $scope, function(data) {
    // Check on gui balance updates to recalculate pocket balance so it shows properly
    if (data.type == 'balance') {
        if (isCurrentPocket(data.pocketId)) {
            onBalanceUpdate();
        }
    }
  });
 
  Port.connectNg('wallet', $scope, function(data) {
    if (data.type == 'ready') {
        if ($scope.isAll) {
            // set stealth address on the general section
            var mainAddress = $scope.identity.wallet.getAddress([0]);
            $scope.pocket.stealth = mainAddress.stealth;
        }
        onBalanceUpdate();
    }
  });

  // History Listing
  $scope.selectFund = function(fund, rowIndex) {
      $scope.pocket.name = fund.name;
      $scope.pocket.index = fund.seq[0];
      var address = $scope.identity.wallet.getAddress(fund.seq);

      $scope.pocket.changeAddresses = [];
      $scope.pocket.addresses = [address];
      $scope.pocket.fund = new MultisigFund(fund);
      $scope.pocket.tasks = $scope.pocket.fund.tasks;

      $scope.isAll = false;
      $scope.isFund = true;
      $scope.pocket.mpk = undefined;
      $scope.pocket.stealth = undefined;
      $scope.selectedPocket = 'fund:' + rowIndex;

      var balance = $scope.identity.wallet.getBalance(fund.seq[0]);

      $scope.balance = balance.confirmed;
      $scope.unconfirmed = balance.unconfirmed;
      $scope.chooseRows();
      $scope.tabs.updateTabs($scope.isAll, $scope.isFund, $scope.pocket.tasks);
  };
  $scope.selectOverview = function() {
      $scope.selectPocket('overview');
  }
  $scope.selectPocket = function(pocketName, rowIndex, form) {
      var pocketIndex;
      if (pocketName === undefined || pocketName == 'overview') {
          $scope.pocket.name = pocketName ? "Overview" : "All Pockets";
          $scope.pocket.index = undefined;
          $scope.pocket.mpk = undefined;
          var mainAddress = $scope.identity.wallet.getAddress([0]);
          $scope.pocket.stealth = mainAddress.stealth;
          $scope.pocket.fund = null;
          $scope.pocket.addresses = $scope.allAddresses;
          $scope.pocket.changeAddresses = [];
          $scope.isAll = true;
          $scope.isOverview = (pocketName == 'overview');
          $scope.isFund = false;
          var balance = $scope.identity.wallet.getBalance();
          $scope.balance = balance.confirmed;
          $scope.unconfirmed = balance.unconfirmed;
          $scope.pocket.tasks = [];
          rowIndex = pocketName ? pocketName : 'all';
      } else {
          pocketIndex = rowIndex*2;
          $scope.pocket.index = pocketIndex;
          $scope.pocket.name = pocketName;
          $scope.pocket.fund = null;
          var walletAddress = $scope.identity.wallet.getAddress([$scope.pocket.index]);
          $scope.pocket.mpk = walletAddress.mpk;
          $scope.pocket.stealth = walletAddress.stealth;
          $scope.pocket.addresses = $scope.addresses[$scope.pocket.index];
          $scope.pocket.changeAddresses = $scope.addresses[$scope.pocket.index+1];
          var walletPocket = $scope.identity.wallet.pockets.getPocket(pocketName);
          $scope.pocket.mixing = walletPocket.mixing;
          $scope.pocket.tasks = [];
          $scope.isAll = false;
          $scope.isFund = false;
          // balance is sum of public and change branches
          var mainBalance = $scope.identity.wallet.getBalance(pocketIndex);
          var changeBalance = $scope.identity.wallet.getBalance(pocketIndex+1);
          $scope.balance = mainBalance.confirmed + changeBalance.confirmed;
          $scope.unconfirmed = mainBalance.unconfirmed + changeBalance.unconfirmed;
          $scope.forms.pocketLabelForm = form;
      }
      $scope.selectedPocket = 'pocket:' + rowIndex;
      $scope.chooseRows();
      $scope.tabs.updateTabs($scope.isAll, $scope.isFund, $scope.pocket.tasks);
  };

  $scope.newMultiSig = function() {
    $scope.selectedPocket = 'newMultisig';
  };

  // Filters
  var fillRowContact = function(contacts, row) {
    if (!row.contact) {
        var contact = contacts.findByAddress(row.address);
        if (contact) {
            row.contact = contact;
        }
    }
  }
 
  // Filter the rows we want to show
  var chooseRows = function() {
    var history = $scope.identity.history.history;
    var rows = history.filter($scope.pocketFilter);
    rows = rows.sort(function(a, b) {
       if (!a.height) {
          return -10000000;
       }
       if (!b.height) {
          return 10000000;
       }
       return b.height - a.height;
    });
    var shownRows = [];
    rows = rows.filter(function(row) { return $scope.historyFilter(row, shownRows) } );
    if (!rows.length) {
        return [];
    }
    // Now calculate balances
    var prevRow = rows[0];
    prevRow.confirmed = $scope.balance;
    prevRow.unconfirmed = $scope.unconfirmed;

    var contacts = $scope.identity.contacts;
    fillRowContact(contacts, prevRow);
    var idx = 1;
    while(idx<rows.length) {
        var row = rows[idx];
        fillRowContact(contacts, row);
        var value = prevRow.total;

        if (prevRow.height) {
            row.confirmed = prevRow.confirmed-value;
            row.unconfirmed = prevRow.unconfirmed;
        } else {
            row.confirmed = prevRow.confirmed;
            // Outgoing unconfirmed are credited straight away
            if (value < 0) {
                row.confirmed -= value;
            }
            row.unconfirmed = prevRow.unconfirmed-value;
        }
        prevRow = row;
        idx++;
    }
    return rows;
  }

  $scope.txFilter = 'last10';
  $scope.addrFilter = 'unused';

  var pocketFilter = function(row) {
      // Making sure shownRows is reset before historyFilter stage is reached.
      if ($scope.isAll) {
          // only add pocket transactions for now
          return typeof row.pocket === 'number';
      }
      else {
          // row pocket here is just 1st element in index, pocket can be pocket/2
          if (typeof row.pocket === 'number') {
              // row.pocket here is the branch id, pocket.index is 2*pocketId
              var pocketBranch = (row.pocket%2) ? row.pocket-1 : row.pocket;
              return pocketBranch == $scope.pocket.index;
          } else {
              return row.pocket == $scope.pocket.index;
          }
      }
  };

  // Get date 30 days ago
  var prevmonth = new Date();
  prevmonth.setDate(prevmonth.getDate()-30);
  // Get date 7 days ago
  var prevweek = new Date();
  prevweek.setDate(prevweek.getDate()-7);

  // Set the history filter
  $scope.setAddressFilter = function(name) {
      $scope.addrFilter = name;
      var addresses = $scope.pocket.addresses.concat($scope.pocket.changeAddresses);
  };

  // Set the history filter
  $scope.setHistoryFilter = function(name) {
      $scope.txFilter = name;
      $scope.chooseRows();
  };

  $scope.addressFilter = function(row) {
      switch($scope.addrFilter) {
          case 'all':
              return true;
          case 'unused':
              return !row.nOutputs;
          case 'top':
              return row.balance>100000;
          case 'labelled':
              return ['unused', 'change'].indexOf(row.label) == -1;
          default:
              break;
      }

  };

  // History filter, run for every row to see if we should show it
  $scope.unusedAddressFilter = function(address) {
      return address.nOutputs == 0;
  };
  $scope.usedAddressFilter = function(address) {
      return address.nOutputs;
  };
  $scope.pocketFilter = function(row) {
      return pocketFilter(row);
  };
  $scope.historyFilter = function(row, shownRows) {
      if (!row.height) {
          shownRows.push(row.hash);
          return true;
      }
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
                  shownRows.push(row.hash);
                  return true;
              }
      }
      return false;
  };

  $scope.chooseRows = function() {
      $scope.historyRows = chooseRows();
  }

  $scope.copyClipboardPublic = function(walletAddress) {
      var pubKey = new Bitcoin.ECPubKey(walletAddress.pubKey, true);
      var publicHex = pubKey.toHex();
      $scope.copyClipboard(publicHex, 'Copied public key to clipboard');
  }

}]);
});
