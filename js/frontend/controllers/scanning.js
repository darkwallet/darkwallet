'use strict';

define(['./module', 'darkwallet', 'util/scanner'], function (controllers, DarkWallet, Scanner) {

  // Controller
  controllers.controller('ScanningCtrl', ['$scope', 'notify', '$wallet', function($scope, notify, $wallet) {

  $scope.scanning = false;
  $scope.scanStatus = "";
  $scope.scanParams = {addresses: 10, pockets: 5, scanMaster: false};

  // Initialize the master pocket address for pockets
  var createMasterAddresses = function() {
      var identity = DarkWallet.getIdentity();
      // Set the identity to manage pocket addresses from now on
      identity.settings.scanPocketMaster = true;
      identity.wallet.pockets.hdPockets.forEach(function(hdPocket, i) {
          var walletAddress = identity.wallet.pubKeys[[i*2]];
          if (hdPocket && walletAddress) {
              DarkWallet.service.wallet.initAddress(walletAddress);
          }
      });

  };

  // Create addresses for the given results
  var createAddresses = function(results, pocketAddressesUsed) {
      var identity = DarkWallet.getIdentity();
      var pockets = identity.wallet.pockets;
      var maxIndex = {};
      // Initialize pockets and check last index for each pocket
      results.forEach(function(seq) {
          var pocketIndex = Math.floor(seq[0]/2);
          if (!maxIndex.hasOwnProperty(seq[0])) {
              maxIndex[seq[0]] = seq[1]||0;
          } else {
              maxIndex[seq[0]] = Math.max(seq[1]||0, maxIndex[seq[0]]);
          }
          if (!pockets.hdPockets[pocketIndex]) {
              // Manual initialization of specific pocket
              pockets.hdPockets[pocketIndex] = {name: "Pocket " + pocketIndex};
              pockets.initPocketWallet(pocketIndex, 'hd', pockets.hdPockets[pocketIndex]);
          }
      });

      // Generate master addresses
      if (pocketAddressesUsed) {
          createMasterAddresses();
      }
 
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
  var onScanFinish = function(err, results, pocketAddressesUsed) {
      if (err) {
          notify.error("Scanning", err.message || ""+err);
      } else {
          $scope.scanning = false;
          $scope.scanStatus = $scope.scanner.status;
          $scope.scanner = undefined;
          createAddresses(results, pocketAddressesUsed);

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
          var scanner = new Scanner(client, identity, onScanFinish, onScanUpdate,
                                    $scope.scanParams.scanMaster);
          scanner.setMargins(parseInt($scope.scanParams.pockets||5),
                             parseInt($scope.scanParams.addresses||10));
          $scope.scanner = scanner;

          // Start scanner
          scanner.scan();
      }
  };

}]);
});
