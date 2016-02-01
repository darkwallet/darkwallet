/**
 * @fileOverview NavbarCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port'],
function (controllers, DarkWallet, Port) {
  controllers.controller('NavbarCtrl', ['$scope', '$history', '$tabs', '$location', '$routeParams', '$route', 'watch', 'modals', 'notify', '_Filter',
      function($scope, $history, $tabs, $location, $routeParams, $route, watch, modals, notify, _) {

  // Scope variables
  $scope.pocket = $history.getCurrentPocket();
  $scope.selectedPocket = $history.selectedPocket;

  $scope.overviewPocket = false;

  /**
   * Identity Loading
   */
  var identityLoaded = function(identity) {
      // set main address on the general section
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
      }
  });



}]);
});
