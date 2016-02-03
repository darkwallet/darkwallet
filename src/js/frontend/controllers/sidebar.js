/**
 * @fileOverview SidebarCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port'],
function (controllers, DarkWallet, Port) {
  controllers.controller('SidebarCtrl', ['$scope', '$history', '$tabs', '$location', '$routeParams', '$route', 'watch', 'modals', 'notify', '_Filter',
      function($scope, $history, $tabs, $location, $routeParams, $route, watch, modals, notify, _) {

  // Scope variables
  $scope.pocket = $history.getCurrentPocket();
  $scope.forms.selectedPocket = $history.selectedPocket;

  $scope.forms.overviewPocket = false;

  // Link tabs from service
  $scope.tabs = $tabs;


  /**
   * Identity Loading
   */
  var identityLoaded = function(identity) {
      identity = identity || DarkWallet.getIdentity();
      if ($history.previousIdentity != identity.name) {
          // prevents loading the first time...

          // Update tabs
          //$scope.tabs.updateTabs($scope.pocket.type, $scope.pocket.tasks);

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
   * Select fund as current pocket
   */
  $scope.selectFund = function(fund, rowIndex) {
      $scope.forms.overviewPocket = false;
      $scope.forms.selectedPocket = 'multisig:'+rowIndex;
      $tabs.open('multisig', rowIndex);
  };


  /**
   * Select an hd pocket
   */
  $scope.selectPocket = function(pocketName, rowIndex) {
      console.log("selectPocket");
      $scope.forms.overviewPocket = false;
      $scope.forms.selectedPocket = false;
      if (pocketName === undefined) {
          $tabs.open();
      } else {
          $tabs.open(undefined, rowIndex);
      }
  };

  $scope.selectReadOnly = function(pocket, rowIndex) {
      $scope.forms.overviewPocket = false;
      $scope.forms.selectedPocket = false,
      $tabs.open('readonly', rowIndex);
  };

  /**
   * Start creating a new multisig
   */
  $scope.newMultiSig = function() {
      $scope.forms.overviewPocket = false;
      $scope.forms.selectedPocket = 'newMultisig';
      $scope.pocket.isAll = false;
  };

  /**
   * Start creating a new pocket
   */
  $scope.newPocket = function() {
      $scope.forms.overviewPocket = false;
      $scope.forms.selectedPocket = 'newPocket';
      $scope.pocket.isAll = false;      
  };

}]);
});
