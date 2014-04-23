/**
 * @fileOverview HistoryCtrl angular controller
 */
'use strict';

define(['./module', 'bitcoinjs-lib', 'util/btc', 'darkwallet', 'dwutil/multisig', 'frontend/port'],
function (controllers, Bitcoin, BtcUtils, DarkWallet, MultisigFund, Port) {
  controllers.controller('HistoryCtrl', ['$scope', 'notify', '$window', '$history', function($scope, notify, $window, $history) {

  // Scope variables
  $scope.pocket = $history.getCurrentPocket();
  $scope.selectedPocket = $history.selectedPocket;

  $scope.historyRows = $history.rows;

  // Filters
  $scope.txFilter = $history.txFilter;
  $scope.addrFilter = $history.addrFilter;

  /**
   * Identity Loading
   */
  var identity = DarkWallet.getIdentity();

  var identityLoaded = function(identity) {
      // set stealth address on the general section
      if ($scope.pocket.isAll && !$scope.pocket.stealth) {
          identity = identity || DarkWallet.getIdentity();
          var mainAddress = identity.wallet.getAddress([0]);
          $scope.pocket.stealth = mainAddress.stealth;
      }
  }
  if (identity && $scope.pocket.isAll) {
      identityLoaded(identity);
  }


  /**
   * Ports: Gui
   */
  Port.connectNg('gui', $scope, function(data) {
    // Check on gui balance updates to recalculate pocket balance so it shows properly
    if (data.type == 'balance') {
        if ($history.isCurrentPocket(data.pocketId)) {
            $scope.historyRows = $history.onBalanceUpdate();
        }
    }
  });
 
  /**
   * Ports: Wallet
   */
  Port.connectNg('wallet', $scope, function(data) {
    if (data.type == 'ready') {
        identityLoaded();

        // update history rows shown
        $scope.historyRows = $history.onBalanceUpdate();
    }
  });


  /**
   * Select fund as current pocket
   */
  $scope.selectFund = function(fund, rowIndex) {
      // Select the fund in history
      $scope.historyRows = $history.selectFund(fund, rowIndex);

      // Set balance in the scope
      $scope.balance = $history.pocket.balance.confirmed;
      $scope.unconfirmed = $history.pocket.balance.unconfirmed;

      // Set the selected pocket
      $scope.selectedPocket = $history.selectedPocket;

      // Update tabs
      $scope.tabs.updateTabs($history.pocket.isAll, $history.pocket.isFund, $history.pocket.tasks);
  };


  /**
   * Select overview as current pocket
   */
  $scope.selectOverview = function() {
      $scope.historyRows = $scope.selectPocket('overview');

      // Set the selected pocket
      $scope.selectedPocket = $history.selectedPocket;
  }


  /**
   * Select an hd pocket
   */
  $scope.selectPocket = function(pocketName, rowIndex, form) {
      if (pocketName === undefined || pocketName == 'overview') {
          $scope.historyRows = $history.selectAll(pocketName, rowIndex);
      } else {
          $scope.historyRows = $history.selectPocket(pocketName, rowIndex);

          $scope.forms.pocketLabelForm = form;
      }

      // Set balance in the scope
      $scope.balance = $scope.pocket.balance.confirmed;
      $scope.unconfirmed = $scope.pocket.balance.unconfirmed;

      // Set the selected pocket
      $scope.selectedPocket = $history.selectedPocket;

      // Update tabs
      $scope.tabs.updateTabs($scope.pocket.isAll, $scope.pocket.isFund, $scope.pocket.tasks);
  };


  /**
   * Start creating a new multisig
   */
  $scope.newMultiSig = function() {
    $scope.selectedPocket = 'newMultisig';
  };


  /**
   * Address filter
   */
  $scope.setAddressFilter = function(name) {
      $scope.addrFilter = name;
      $scope.historyRows = $history.setAddressFilter(name);
  };

  $scope.addressFilter = function(row) {
      return $history.addressFilter(row);
  };


  /**
   * History filter
   */
  $scope.pocketFilter = function(row) {
      return $history.pocketFilter(row);
  };

  // Set the history filter
  $scope.setHistoryFilter = function(name) {
      $scope.txFilter = name;
      $scope.historyRows = $history.setHistoryFilter(name);
  };

  $scope.historyFilter = function(row, shownRows) {
      return $history.historyFilter(row, shownRows);
  };


  /**
   * Utility scope functions
   */
  $scope.copyClipboardPublic = function(walletAddress) {
      var pubKey = new Bitcoin.ECPubKey(walletAddress.pubKey, true);
      var publicHex = pubKey.toHex();
      $scope.copyClipboard(publicHex, 'Copied public key to clipboard');
  }

  $scope.saveStore = function() {
      var identity = DarkWallet.getIdentity();
      identity.store.save();
  }

}]);
});
