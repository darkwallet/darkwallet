define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  'use strict';
  controllers.controller('ReceiveStealthCtrl', ['$scope', 'toaster', 'ngProgress', function($scope, toaster, ngProgress) {
  // function to receive stealth information
  $scope.stealth = {'password': ''};
  $scope.receiveStealth = function() {
      toaster.pop('note', "stealth", "initializing")
      ngProgress.start();
      
      var client = DarkWallet.getClient();
      var stealth_fetched = function(error, results) {
          if (error) {
              console.log("error on stealth");
              toaster.pop('error', "stealth", error)
              //write_to_screen('<span style="color: red;">ERROR:</span> ' + error);
              return;
          }
          console.log("STEALTH", results);
          try {
              $scope.identity.wallet.processStealth(results);
              toaster.pop('success', "stealth", "ok")
          } catch (e) {
              toaster.pop('error', "stealth", e.message)
          }
          ngProgress.complete();
      }
      client.fetch_stealth([0,0], stealth_fetched, 0);
  }

}]);
});
