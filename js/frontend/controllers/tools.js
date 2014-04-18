define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  'use strict';

  // Controller
  controllers.controller('ToolsCtrl', ['$scope', 'notify', function($scope, notify) {

  var finishClearStorage = function() {
      var keyRing = DarkWallet.getKeyRing();
      keyRing.clear();
      notify.note('Storage cleared, please restart your browser.');
  }

  // Clear the local storage
  $scope.clearStorage = function() {
      $scope.openModal('confirm-delete', {name: 'Your WHOLE storage', object: {}}, finishClearStorage)
  };
  
  $scope.clearTasks = function() {
      var identity = DarkWallet.getIdentity();
      identity.tasks.clear();
      notify.note('Tasks cleared.');
  };
  

}]);
});
