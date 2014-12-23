'use strict';

define(['./module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {

  // Controller
  controllers.controller('ToolsCtrl', ['$scope', 'modals', 'notify', '$history', '_Filter', function($scope, modals, notify, $history, _) {

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
      notify.note(_('Storage cleared, please restart your browser.'));
  }

  $scope.clearStorage = function() {
      modals.open('confirm-delete', {name: _('Your WHOLE storage'), object: {}}, finishClearStorage)
  };
  
  // Clear all tasks
  $scope.clearTasks = function() {
      var identity = DarkWallet.getIdentity();
      identity.tasks.clear();
      notify.note(_('Tasks cleared.'));
  };

  // Clear all unconfirmed spends
  $scope.clearPendingSpends = function() {
      var toDelete = [];
      // Find unconfirmed outgoing rows
      var identity = DarkWallet.getIdentity();
      identity.history.history.forEach(function(row) {
          if (!row.height && row.inMine) {
              toDelete.push(row);
          }
      });
      // Delete candidate rows
      toDelete.forEach(function(row) {
          identity.tx.undo(row.tx, row);
      });
      // Now look for any unspent outputs that didn't have a row.
      Object.keys(identity.wallet.wallet.outputs).forEach(function(outId) {
          var output = identity.wallet.wallet.outputs[outId];
          if (output.spend && !output.spendheight) {
              output.clearSpend();
          }
      });
      $history.chooseRows();
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
