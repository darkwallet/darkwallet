/**
 * @fileOverview HistoryCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port'],
function (controllers, DarkWallet, Port) {
  controllers.controller('HistoryCtrl', ['$scope', '$history', '$tabs', '$location', function($scope, $history, $tabs, $location) {

  // Scope variables
  $scope.pocket = $history.getCurrentPocket();
  $scope.selectedPocket = $history.selectedPocket;

  $scope.historyRows = $history.rows;

  // Link tabs from service
  $scope.tabs = $tabs;

  // Filters
  $scope.txFilter = $history.txFilter;


  /**
   * Identity Loading
   */
  var identityLoaded = function(identity) {
      // set main address on the general section
      identity = identity || DarkWallet.getIdentity();
      if ($scope.pocket.isAll && !$scope.pocket.stealth) {
          var mainAddress = identity.wallet.getAddress([0]);
          $scope.pocket.mainAddress = mainAddress.stealth;
      }
      if ($history.previousIdentity != identity.name) {
          if ($history.previousIdentity) {
              $scope.historyRows = $history.selectAll();
              // Set the selected pocket
              $scope.selectedPocket = $history.selectedPocket;

              // Update tabs
              $scope.tabs.updateTabs($scope.pocket.isAll, $scope.pocket.isFund, $scope.pocket.tasks);
          }

          $history.previousIdentity = identity.name;
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      }
  }

  var identity = DarkWallet.getIdentity();
  if (identity) {
      identityLoaded(identity);
  }


  /**
   * Gui Port
   */
  Port.connectNg('gui', $scope, function(data) {
      // Check on gui balance updates to recalculate pocket balance so it shows properly
      if (data.type == 'balance') {
          if ($history.isCurrentPocket(data.pocketId)) {
              $scope.historyRows = $history.onBalanceUpdate();
              if (!$scope.$$phase) {
                  $scope.$apply();
              }
          }
      }
  });
 
  /**
   * Wallet port
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

      // Set the selected pocket
      $scope.selectedPocket = $history.selectedPocket;

      // Update tabs
      $scope.tabs.updateTabs($history.pocket.isAll, $history.pocket.isFund, $history.pocket.tasks);
  };


  /**
   * Select an hd pocket
   */
  $scope.selectPocket = function(pocketName, rowIndex, form) {
      if (pocketName === undefined) {
          $scope.historyRows = $history.selectAll(pocketName, rowIndex);
      } else {
          $scope.historyRows = $history.selectPocket(pocketName, rowIndex);

          $scope.forms.pocketLabelForm = form;
      }

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
      $scope.pocket.isAll = false;
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


}]);
});
