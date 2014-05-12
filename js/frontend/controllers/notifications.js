/**
 * @fileOverview Popup classes.
 */
'use strict';

/**
 * Controller for notifications
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['frontend/controllers/module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {
  controllers.controller('NotificationsCtrl', ['$scope', function($scope) {

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
                  var outPocket, inPocket;
                  if (!(task.outPocket === undefined)) {
                      outPocket = identity.wallet.getPocket(task.outPocket);
                  }
                  if (!(task.inPocket === undefined)) {
                      inPocket = identity.wallet.getPocket(task.inPocket);
                  }
                  var guiTask = {section: section, store: task, outPocket: outPocket, inPocket: inPocket};
                  if (section == 'multisig') {
                      // Get this here so we don't need Object in angular :-P
                      guiTask.signed = Object.keys(task.pending[0].signatures).length;
                      guiTask.fund = identity.wallet.multisig.search({address: task.inPocket});
                  }
                  tasks.push(guiTask);
              }
          });
      });
      $scope.tasks = tasks;
  }

  // Wallet service, connect to get notified about identity getting loaded.
  Port.connect('wallet', function(data) {
    if (data.type == 'ready') {
        // identity is ready here
        linkTasks();
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }
  });

}]);
});
