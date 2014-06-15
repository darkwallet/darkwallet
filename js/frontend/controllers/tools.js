'use strict';

define(['./module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {

  // Controller
  controllers.controller('ToolsCtrl', ['$scope', 'modals', 'notify', function($scope, modals, notify) {

  // General variable to coordinate tools
  $scope.tools = {status: 'OK'};

  // Store size
  $scope.storeSize = 0;
  $scope.totalStoreSize = 0;

  /**
   * An identity is being loaded
   */
  var onLoadIdentity = function(name) {
      // Get partial size
      DarkWallet.getKeyRing().getSize(name, function(value) {
          $scope.storeSize = Math.ceil(value/1024);
          if(!$scope.$$phase) {
              $scope.$apply();
          }
      });
      // Get full size
      DarkWallet.getKeyRing().getSize(null, function(value) {
          $scope.totalStoreSize = Math.ceil(value/1024);
          if(!$scope.$$phase) {
              $scope.$apply();
          }
      });
  };

  /**
   * Listen for identity loading and set scope
   */
  Port.connectNg('wallet', $scope, function(data) {
    if (data.type == 'ready') {
        onLoadIdentity(data.identity);
    }
  });


  // Clear the local storage
  var finishClearStorage = function() {
      var keyRing = DarkWallet.getKeyRing();
      keyRing.clear();
      notify.note('Storage cleared, please restart your browser.');
  }

  $scope.clearStorage = function() {
      modals.open('confirm-delete', {name: 'Your WHOLE storage', object: {}}, finishClearStorage)
  };
  
  // Clear all tasks
  $scope.clearTasks = function() {
      var identity = DarkWallet.getIdentity();
      identity.tasks.clear();
      notify.note('Tasks cleared.');
  };

  $scope.newModal = function(name) {
      modals.open(name, {});
  }

  // Enable advanced mode
  $scope.setAdvanced = function() {
      var identity = DarkWallet.getIdentity();
      identity.store.save();
  };


}]);
});
