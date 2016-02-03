/**
 * @fileOverview HistoryCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port'],
function (controllers, DarkWallet, Port) {
  controllers.controller('HistoryCtrl', ['$scope', '$history', '$tabs', '$location', '$routeParams', '$route', 'watch', 'modals', 'notify', '_Filter',
      function($scope, $history, $tabs, $location, $routeParams, $route, watch, modals, notify, _) {

  // Scope variables
  $scope.pocket = $history.getCurrentPocket();
  $scope.forms.selectedPocket = $history.selectedPocket;

  // pages
  $scope.nPages = 0;
  $scope.page = 0;
  var limit = 10;

  $scope.setPage = function(page, updatePage) {
      if (page >= $scope.nPages) {
          page = $scope.nPages-1;
      }
      if (page < 0) {
          page = 0;
      }
      if (updatePage) {
          $scope.page = page;
      }
      $scope.historyRows = $scope.allHistoryRows.slice($scope.page*limit, ($scope.page*limit) + limit);
  };


  // Set current rows
  var setHistoryRows = function(rows, updatePage) {
      $scope.allHistoryRows = rows;
      $scope.nPages = Math.ceil($scope.allHistoryRows.length/limit);
      $scope.setPage(0, updatePage);
  }

  setHistoryRows($history.rows, true);

  $tabs.loadRoute($routeParams.section, $routeParams.pocketType, $routeParams.pocketId);

  // Link tabs from service
  $scope.tabs = $tabs;

  // Filters
  $scope.txFilter = $history.txFilter;

  var checkChanges = function(type, idx, force) {
    var changed = $history.setCurrentPocket(type, idx, force);
    if (changed) {
        $scope.pocket = $history.getCurrentPocket();
        setHistoryRows($history.rows, true);
        $scope.forms.selectedPocket = $history.selectedPocket;
        $tabs.updateTabs($scope.pocket.type, $scope.pocket.tasks);
        // If the rename form is open we need to change the default shown there
        if ($scope.forms.pocketName) {
            $scope.forms.pocketName = $scope.pocket.name;
        }
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
      var pocketId = $routeParams.pocketId;
      checkChanges($routeParams.pocketType, pocketId?parseInt(pocketId):undefined, true);

      // Update tabs
      $scope.tabs.updateTabs($scope.pocket.type, $scope.pocket.tasks);

      $history.previousIdentity = identity.name;
      if (!$scope.$$phase) {
          $scope.$apply();
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
              setHistoryRows($history.onBalanceUpdate(), false);
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
          setHistoryRows($history.onBalanceUpdate(), true);
      }
      else if (data.type == 'rename') {
          $history.previousIdentity = data.newName;
      }
  });


  /**
   * Set overview information (for extra balance on the dashboard area header)
   */
  $scope.setOverview = function(overview) {
      $scope.forms.overviewPocket = overview;
  }


  /**
   * History filter
   */
  $scope.pocketFilter = function(row) {
      return $history.pocketFilter(row);
  };

  // Set the history filter
  $scope.setHistoryFilter = function(name) {
      if ($scope.txFilter !== name) {
          $scope.txFilter = name;
          setHistoryRows($history.setHistoryFilter(name), true);
      }
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
      var newKey;
      var row = $scope.currentRow;

      // Check to see if it was just added while creating a new contact
      var lastKey = contact.pubKeys[contact.pubKeys.length-1].data;
      if (lastKey.data === row.address || lastKey.address === row.address) {
          newKey = lastKey;
      } else {
          // Otherwise create a new key on an existing contact
          newKey = contact.addKey(row.address);
      }

      // If pocket is watch only add the new address
      if (contact.data.watch) {
          watch.addKey(contact, newKey);
          $history.refreshAddresses();
      }
      $history.chooseRows();
  };

  /**
   * Clear selected transaction
   */
  $scope.rowUndo = function(row) {
      modals.open('confirm', {message: _('Are you sure?'),
                              detail: _('Clearing the pending transaction will free the funds but it can still be confirmed if it reached the network.')}, function() {
          var identity = DarkWallet.getIdentity();
          identity.tx.undo(row.tx, row);
          $history.chooseRows();
      });
  };

  /**
   * Re-broadcast selected transaction
   */
  $scope.rowBroadcast = function(row) {
      var done = false;
      var client = DarkWallet.getClient();
      client.broadcast_transaction(row.tx.toHex(), function(error, count, type) {
          if (type === 'brc' && !done) {
              if (error || !count) {
                  notify.error("Error broadcasting");
              } else {
                  notify.success("Broadcasted ok!");
                  done = true;
              };
              if (!$scope.$$phase) {
                  $scope.$apply();
              }
          }
      });
  };

}]);
});
