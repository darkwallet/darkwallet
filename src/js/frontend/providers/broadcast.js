'use strict';

define(['./module', 'darkwallet'], function (providers, DarkWallet) {

providers.factory('$brc', ['notify', '$rootScope', '_Filter', function(notify, $scope, _) {

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
              notify.warning(_('Failed Broadcasting'), _('Imported but failed to broadcast') + ' ' + _(err));
          } else if (data.type == 'radar' && task.broadcasting) {
              task.broadcasted = true;
              task.radar = data.radar;
              task.broadcasting = false;
              notify.success(_('Imported'), _('Signature imported and sent to broadcaster!'));
          } else if (data.type == 'radar') {
              task.radar = data.radar;
              notify.note(_('Broadcasting'), _('Radar') + ': ' + _(data.radar));
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
