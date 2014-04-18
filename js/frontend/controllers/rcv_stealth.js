define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  'use strict';
  controllers.controller('ReceiveStealthCtrl', ['$scope', 'notify', function($scope, notify) {
  // function to receive stealth information
  $scope.receiveStealth = function() {
      notify.note("stealth", "initializing");
      notify.progress.start();
      
      var client = DarkWallet.getClient();
      var stealth_fetched = function(error, results) {
          if (error) {
              console.log("error on stealth");
              notify.error("stealth", error);
              //write_to_screen('<span style="color: red;">ERROR:</span> ' + error);
              return;
          }
          console.log("fetching stealth", results);
          var addresses;
          try {
              addresses = $scope.identity.wallet.processStealth(results);
          } catch (e) {
              notify.error("stealth", e.message);
              return;
          }
          if (addresses && addresses.length) {
              var walletService = DarkWallet.getService('wallet');
              addresses.forEach(function(walletAddress) {
                  walletService.initAddress(walletAddress);
              })
              notify.success("stealth ok");
          } else {
              notify.success("stealth ok", "payments detected");
          }
      }
      client.fetch_stealth([0,0], stealth_fetched, 0);
  };

}]);
});
