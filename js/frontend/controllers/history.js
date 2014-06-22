/**
 * @fileOverview HistoryCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port'],
function (controllers, DarkWallet, Port) {
  controllers.controller('HistoryCtrl', ['$scope', '$history', '$tabs', '$location', '$routeParams', '$route', 'watch', function($scope, $history, $tabs, $location, $routeParams, $route, watch) {

  // Scope variables
  $scope.pocket = $history.getCurrentPocket();
  $scope.selectedPocket = $history.selectedPocket;

  $scope.historyRows = $history.rows;

  $tabs.loadRoute($routeParams.section, $routeParams.pocketType, $routeParams.pocketId);

  // Link tabs from service
  $scope.tabs = $tabs;

  // Filters
  $scope.txFilter = $history.txFilter;

  var checkChanges = function(type, idx, force) {
    var changed = $history.setCurrentPocket(type, idx, force);
    if (changed) {
        $scope.pocket = $history.getCurrentPocket();
        $scope.historyRows = $history.rows;
        $scope.selectedPocket = $history.selectedPocket;
        $tabs.updateTabs($scope.pocket.type, $scope.pocket.tasks);
    }
  };

  // Don't reload the controller if coming from this tab
  var lastRoute = $route.current;
  $scope.$on('$locationChangeSuccess', function(event) {
    if ($route.current.templateUrl && $route.current.templateUrl.indexOf('wallet.html') > 0) {
        var params = $route.current.pathParams;
        var pocketId = params.pocketId;
        $tabs.loadRoute(params.section, params.pocketType, pocketId, function() {
            checkChanges(params.pocketType, pocketId?parseInt(pocketId):undefined);
        });
        // Overwrite the route so the template doesn't reload
        $route.current = lastRoute;
    }
  });

  /**
   * Identity Loading
   */
  var identityLoaded = function(identity) {
      // set main address on the general section
      identity = identity || DarkWallet.getIdentity();
      if ($scope.pocket.type === 'init') {
          var mainAddress = identity.wallet.getAddress([0]);
          $scope.pocket.mainAddress = mainAddress.stealth;
      }
      if ($history.previousIdentity != identity.name) {
          // prevents loading the first time...
          //if ($history.previousIdentity) {
          var pocketId = $routeParams.pocketId;
          checkChanges($routeParams.pocketType, pocketId?parseInt(pocketId):undefined, true);

          // Update tabs
          $scope.tabs.updateTabs($scope.pocket.type, $scope.pocket.tasks);
          //}

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
      else if (data.type == 'rename') {
          $history.previousIdentity = data.newName;
      }
  });


  /**
   * Select fund as current pocket
   */
  $scope.selectFund = function(fund, rowIndex) {
      $tabs.open('multisig', rowIndex);
  };


  /**
   * Select an hd pocket
   */
  $scope.selectPocket = function(pocketName, rowIndex, form) {
      if (pocketName === undefined) {
          $tabs.open();
      } else {
          $scope.forms.pocketLabelForm = form;
          $tabs.open(undefined, rowIndex);
      }
  };

  $scope.selectReadOnly = function(pocket, rowIndex) {
      $tabs.open('readonly', rowIndex);
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


  /**
   * Row dropdown selector
   */
  $scope.setCurrentRow = function(row, editForm) {
      $scope.currentRow = row;
      $scope.rowEdit  = {label: row.label};
      $scope.currentForm = editForm;
  };
  $scope.saveRowLabel = function() {
      var identity = DarkWallet.getIdentity();
      $scope.currentRow.label = $scope.rowEdit.label;
      identity.txdb.setLabel($scope.currentRow.hash, $scope.rowEdit.label);
  };

  /**
   * Add current row's address to a contact
   */
  $scope.addToContact = function(contact) {
      var row = $scope.currentRow;
      var newKey = contact.addKey(row.address);

      // If pocket is watch only add the new address
      if (contact.data.watch) {
          watch.addKey(contact, newKey);
          $history.refreshAddresses();
      }
      $history.chooseRows();
  };

}]);
});
