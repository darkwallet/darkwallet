define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  'use strict';

  // Controller
  controllers.controller('ToolsCtrl', ['$scope', 'notify', function($scope, notify) {

  // Clear the local storage
  $scope.clearStorage = function() {
      var keyRing = DarkWallet.getKeyRing();
      keyRing.clear();
      notify.note('Storage cleared, please restart your browser.');
  };
  
  $scope.clearTasks = function() {
      var identity = DarkWallet.getIdentity();
      identity.tasks.clear();
      notify.note('Tasks cleared.');
  };
  

}]);
});
