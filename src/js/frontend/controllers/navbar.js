/**
 * @fileOverview NavbarCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port'],
function (controllers, DarkWallet, Port) {
  controllers.controller('NavbarCtrl', ['$scope', '$history',
      function($scope, $history) {

  // Scope variables
  $scope.pocket = $history.getCurrentPocket();

  /**
   * Wallet port
   */
  Port.connectNg('wallet', $scope, function(data) {
      if (data.type == 'ready') {
          $scope.pocket = $history.getCurrentPocket();
      }
  });



}]);
});
