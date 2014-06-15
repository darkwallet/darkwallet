'use strict';

define(['./module', 'darkwallet'], function (providers, DarkWallet) {

providers.factory('$brc', ['notify', '$rootScope', function(notify, $scope) {

var broadcast = {
  /**
   * Check if we have enough signatures and put them into the transaction
   */
  broadcast: function(tx, task) {
      // Callback listening for radar events
      var broadcastCallback = function(err, data) {
          console.log("radar feedback", data);
          if (err) {
              task.error = "Failed: " + err;
              notify.warning("Failed Broadcasting", "Imported but failed to broadcast " + err);
          } else if (data.type == 'radar' && task.broadcasting) {
              task.broadcasted = true;
              task.radar = data.radar;
              task.broadcasting = false;
              notify.success('Imported', 'Signature imported and sent to broadcaster!');
          } else if (data.type == 'radar') {
              task.radar = data.radar;
              notify.note('Broadcasting', 'Radar: ' + data.radar);
          }
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      };

      // Broadcast
      task.broadcasting = true;
      var walletService = DarkWallet.service.wallet;
      walletService.broadcastTx(tx, false, broadcastCallback);
  }
};

return broadcast;
}]);
});
