'use strict';

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  controllers.controller('ReceiveStealthCtrl', ['$scope', 'notify', '$wallet', '_Filter', function($scope, notify, $wallet, _) {
  // function to receive stealth information
  $scope.receiveStealth = function() {
      notify.note("stealth", "initializing");

      // Callback for detected addresses
      var onStealth = function(error, addresses) {
          if (error) {
              notify.error(_('Error fetching stealth'), error.message||error);
              //write_to_screen('<span style="color: red;">ERROR:</span> ' + error);
              return;
          }
          // Add all addresses to scope
          if (addresses && addresses.length) {
              addresses.forEach(function(walletAddress) {
                  // TODO: should be added to scope in response to some event
                  $wallet.addToScope(walletAddress);
              })
              notify.success(_('Stealth transactions processed'), _('{0} payments detected', addresses.length));
          } else {
              notify.success(_('Stealth transactions processed'));
          }
      }

      // Fetch stealth using the wallet service, specify height as
      // 0 will make it restart from the beginning
      DarkWallet.service.stealth.fetch(0, onStealth);
  };

}]);
});
