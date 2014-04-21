/**
 * @fileOverview TabsCtrl angular controller
 */
'use strict';

define(['./module'], function (controllers) {
  controllers.controller('TabsCtrl', ['$scope', function($scope) {

  /**
   * Tabs
   */ 
  $scope.tabs.current = 0;
  $scope.tabs.previous = 0;
  $scope.tabs.pages = [
      {heading: 'Overview', page: 'dashboard', active: true, visible: true},
      {heading: 'Transactions', page: 'history', visible: true},
      {heading: 'Addresses', page: 'addresses', visible: true},
      {heading: 'Fund', page: 'fund'},
      {heading: 'Tasks', page: 'tasks'},
      {heading: 'Actions', page: 'actions'}
  ];
  $scope.tabs.selectTab = function(selected, index) {
        $scope.tabs.previous = $scope.tabs.current;
        $scope.tabs.current = index;
        $scope.tabs.pages.forEach(function(tab) {
            tab.active = tab.page == selected.page;
        });
  };
  $scope.tabs.updateTabs = function(isAll, isFund, tasks) {
      if (isFund) {
          $scope.tabs.pages[3].visible = true;  // fund
          $scope.tabs.pages[5].visible = false; // actions
      } else {
          $scope.tabs.pages[3].visible = false; // fund
          $scope.tabs.pages[5].visible = !isAll;  // actions
      }
      if (tasks && tasks.length) {
          $scope.tabs.pages[4].visible = true;
      } else {
          $scope.tabs.pages[4].visible = false;
      }
      if ($scope.tabs.pages[$scope.tabs.current].visible == false) {
          $scope.tabs.pages[$scope.tabs.current].active = false;
          $scope.tabs.current = 0;
          $scope.tabs.pages[0].active = true;      
      }
  }
}]);
});
