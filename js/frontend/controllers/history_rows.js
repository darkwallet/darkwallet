/**
 * @fileOverview HistoryRowsCtrl angular controller
 */
'use strict';

define(['./module'], function (controllers) {
  controllers.controller('HistoryRowsCtrl', ['$scope', '$history', function($scope, $history) {

  if (['last10'].indexOf($history.txFilter) > -1) {
     $scope.setHistoryFilter('last');
  }


  }]);
});
