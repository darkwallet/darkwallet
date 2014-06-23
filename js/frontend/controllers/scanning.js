'use strict';

define(['./module', 'darkwallet', 'util/scanner'], function (controllers, DarkWallet, Scanner) {

  // Controller
  controllers.controller('ScanningCtrl', ['$scope', 'notify', '$wallet', function($scope, notify, $wallet) {

  $scope.scanning = false;
  $scope.scanStatus = "";

  // Create addresses for the given results
  var createAddresses = function(results) {
      var identity = DarkWallet.getIdentity();
      var pockets = identity.wallet.pockets;
      var maxIndex = {};
      // Initialize pockets and check last index for each pocket
      results.forEach(function(seq) {
          var pocketIndex = Math.floor(seq[0]/2);
          if (!maxIndex.hasOwnProperty(seq[0])) {
              maxIndex[seq[0]] = seq[1];
          } else {
              maxIndex[seq[0]] = Math.max(seq[1], maxIndex[seq[0]]);
          }
          if (!pockets.hdPockets[pocketIndex]) {
              // Manual initialization of specific pocket
              pockets.hdPockets[pocketIndex] = {name: "Pocket " + pocketIndex};
              pockets.initPocketWallet(pocketIndex, 'hd', pockets.hdPockets[pocketIndex]);
          }
      });
      // Now generate addresses
      Object.keys(maxIndex).forEach(function(branchId) {
          var pocketIndex = Math.floor(branchId/2);
          for(var i=0; i<=maxIndex[branchId]; i++) {
              var seq = [branchId, i];
              if (!identity.wallet.pubKeys[seq]) {
                  $wallet.generateAddress(seq[0], seq[1]);
              } else {
                  console.log("Already exists!");
              }
          }
      });
      pockets.store.save();
  };

  // Update every time we get results for an address
  var onScanUpdate = function(scanned, max) {
      $scope.scanProgress = (scanned / max)*100;
      $scope.scanned = {max: max, scanned: scanned};
      if (!$scope.$$phase) {
          $scope.$apply();
      }
  };

  // Scan finished callback
  var onScanFinish = function(err, results) {
      if (err) {
          notify.error("Scanning", err.message || ""+err);
      } else {
          createAddresses(results);
          notify.success("Scanning", "Finished. Found " + results.length + " addresses");
      }
  };

  // Scan all addresses from seed
  $scope.scanSeed = function() {
      $scope.scanning = true;
      notify.note("Start Scanning");
      $scope.scanned = {max: 100, scanned: 0};
      $scope.scanStatus = "Scanning...";
      $scope.scanProgress = 0;
      var client = DarkWallet.getClient();
      if (client) {
          var identity = DarkWallet.getIdentity();
          var scanner = new Scanner(client, identity, onScanFinish, onScanUpdate);
          $scope.scanner = scanner;

          // Start scanner
          scanner.scan();
      }
  };

}]);
});
