/**
 * @fileOverview OverviewCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {
  controllers.controller('NgModalCtrl', ['$scope', function($scope) {

  $scope.ok = function() {
      $scope.ngModals.page = false;
      $scope.ngModals.show = false;
  }
  $scope.cancel = function() {
      $scope.ngModals.page = false;
      $scope.ngModals.show = false;
  }
  }]);
});
