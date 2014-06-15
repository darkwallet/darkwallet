/**
 * @fileOverview OverviewCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port', 'angular'], function (controllers, DarkWallet, Port, Angular) {
  controllers.controller('NgModalCtrl', ['$scope', function($scope) {

  $scope.vars = $scope.modals.vars;

  $scope.onKeyDown = function(evt) {
      if (evt.keyCode == 27) {
          $scope.cancel();
      }
  };

  $scope.ok = function(data) {
      $scope.modals.show = false;
      if ($scope.modals.okCallback) {
          $scope.modals.okCallback(data, $scope.vars);
      }
  }
  $scope.cancel = function(reason) {
      $scope.modals.show = false;
      if ($scope.modals.cancelCallback) {
          $scope.modals.cancelCallback(reason, $scope.vars);
      }
  }
  }]);
});
