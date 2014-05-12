'use strict';

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  controllers.controller('ReceiveStealthCtrl', ['$scope', 'notify', '$wallet', function($scope, notify, $wallet) {
  // function to receive stealth information
  $scope.receiveStealth = function() {
      notify.note("stealth", "initializing");

      // Callback for detected addresses
      var onStealth = function(error, addresses) {
          if (error) {
              notify.error("Error fetching stealth", error.message||error);
              //write_to_screen('<span style="color: red;">ERROR:</span> ' + error);
              return;
          }
          // Add all addresses to scope
          var identity = DarkWallet.getIdentity();
          if (addresses && addresses.length) {
              addresses.forEach(function(walletAddress) {
                  // TODO: should be added to scope in response to some event
                  $wallet.addToScope(walletAddress);
              })
              notify.success("stealth ok", addresses.length + " payments detected");
          } else {
              notify.success("stealth ok");
          }
      }

      // Fetch stealth using the wallet service, specify height as
      // 0 will make it restart from the beginning
      DarkWallet.service.stealth.fetch(0, onStealth);
  };

}]);
});
