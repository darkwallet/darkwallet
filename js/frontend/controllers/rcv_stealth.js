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
          console.log("STEALTH", results);
          try {
              $scope.identity.wallet.processStealth(results);
              notify.success("stealth", "ok");
          } catch (e) {
              notify.error("stealth", e.message);
          }
          notify.progress.complete();
      }
      client.fetch_stealth([0,0], stealth_fetched, 0);
  };

}]);
});
