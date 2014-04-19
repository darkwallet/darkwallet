/**
 * @fileOverview Popup classes.
 */

/**
 * Popup class constructor to handle identities.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['frontend/controllers/module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {
  'use strict';
  controllers.controller('PopupCtrl', ['$scope', function($scope) {

  $scope.currentIdentity = false;

  $scope.tasks = [];

  var linkTasks = function() {
      var identity = DarkWallet.getIdentity();
      var sections = Object.keys(identity.tasks.tasks);
      var tasks = [];
      sections.forEach(function(section) {
          identity.tasks.tasks[section].forEach(function(task) {
              if (!task.seen) {
                  // TODO: to be removed:
                  if (task.progress === undefined) {
                      task.progress = 33;
                  }
                  tasks.push({section: section, store: task});
              }
          });
      });
      $scope.tasks = tasks;
  }

  // Wallet service, connect to get notified about identity getting loaded.
  Port.connect('wallet', function(data) {
    if (data.type == 'ready') {
        // identity is ready here
        $scope.currentIdentity = data.identity;
        linkTasks();
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }
  });


  var keyRing = DarkWallet.getKeyRing();
  $scope.identityChange = function() {
    if (!$scope.identity) {
        return;
    }
  };
  keyRing.loadIdentities(function(identityNames) {
    var identities = [];
    identityNames.forEach(function(item) {
      identities.push({id: item});
    });
    $scope.identities = identities;
    if (!$scope.currentIdentity) {
        $scope.currentIdentity = identityNames[0];
    }
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  });
}]);
});
