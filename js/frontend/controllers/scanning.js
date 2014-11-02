'use strict';

define(['./module', 'darkwallet', 'util/scanner'], function (controllers, DarkWallet, Scanner) {

  // Controller
  controllers.controller('ScanningCtrl', ['$scope', 'notify', '$wallet', '_Filter', 'modals', function($scope, notify, $wallet, _, modals) {

  $scope.scanning = false;
  $scope.scanStatus = "";
  $scope.scanParams = {addresses: 10, pockets: 5, scanMaster: false, scanOld: false};

  // Initialize the master pocket address for pockets
  var createMasterAddresses = function(results) {
      var identity = DarkWallet.getIdentity();
      // Set the identity to manage pocket addresses from now on
      identity.settings.scanPocketMaster = true;
      results.forEach(function(seq) {
          if (seq.length === 1) {
              var walletAddress = identity.wallet.getAddress(seq);
              if (walletAddress) {
                  $wallet.initAddress(walletAddress);
              }
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
          createMasterAddresses(results);
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
          notify.error(_('Scanning'), err.message || ""+err);
      } else {
          $scope.scanning = false;
          $scope.scanStatus = $scope.scanner.status;
          $scope.scanner = undefined;
          createAddresses(results, pocketAddressesUsed);

          notify.success(_('Scanning'), _('Finished. Found {0} addresses', results.length));
      }
  };

  var runScanner = function(client, identity, password) {
      var scanMaster = false, masterKey = null;
      if (identity.store.get('version') > 4 && !$scope.scanParams.scanOld) {
           // new style
           // we never scanMaster here
           masterKey = identity.store.getPrivateData(password).privKey;
      } else {
           // old style
           scanMaster = $scope.scanParams.scanMaster;
      }
      var scanner = new Scanner(client, identity, masterKey,
                                onScanFinish, onScanUpdate, scanMaster);

      scanner.setMargins(parseInt($scope.scanParams.pockets||5),
                             parseInt($scope.scanParams.addresses||10));
      $scope.scanner = scanner;

      // Start scanner
      scanner.scan();
  };

  // Scan all addresses from seed
  $scope.scanSeed = function() {
      $scope.scanning = true;
      notify.note(_('Start Scanning'));
      $scope.scanned = {max: 100, scanned: 0};
      $scope.scanStatus = _('Scanning...');
      $scope.scanProgress = 0;
      var client = DarkWallet.getClient();
      if (client) {
          var identity = DarkWallet.getIdentity();
          if (identity.store.get('version') > 4 && !scope.scanParams.scanOld) {
              modals.password(_('Write your password for scanning'), function(password) {
                  runScanner(client, identity, password);
              });
          } else {
              runScanner(client, identity);
          }
      }
  };

}]);
});
