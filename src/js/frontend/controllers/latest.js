/**
 * @fileOverview LatestCtrl angular controller
 */
'use strict';

define(['./module'], function (controllers) {
  controllers.controller('LatestCtrl', ['$scope', '$history', function($scope, $history) {

  if (['daily', 'weekly', 'monthly', 'last'].indexOf($history.txFilter) > -1) {
     $scope.setHistoryFilter('last10');
  }


  }]);
});
