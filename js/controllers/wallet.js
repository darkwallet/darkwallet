/**
 * @fileOverview Wallet classes.
 */

/**
 * Wallet constructor class.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  'use strict';
  controllers.controller('WalletCtrl',
  ['$scope', '$location' ,'ngProgress', 'toaster', '$modal', function($scope, $location, ngProgress, toaster, $modal) {
  var pubKey, mpKey, addressIndex;

  // Tabs
  $scope.isActive = function(route) {
    return route === $location.path();
  }

  // generated addresses
  $scope.addresses = {};
  $scope.allAddresses = [];

  var bg = DarkWallet.service();

  // Listen for messages from the background service
  bg.addListener(function(message, send) {
    if (message.name == 'guiUpdate' || message.name == 'balanceUpdate') {
        if (message.name == 'balanceUpdate') {
            console.log("balance update message", message);
            //$scope.totalBalance = $scope.identity.wallet.getBalance();
        }
    }
    if (message.name == 'height') {
        $scope.currentHeight = message.value;
    }
    // apply interface changes
    if(['height', 'guiUpdate', 'balanceUpdate'].indexOf(message.name) > -1 && !$scope.$$phase) {
        $scope.$apply();
    }
  });

  // Initialize if empty wallet
  function initializeEmpty() {
      if (Object.keys($scope.addresses).length == 0) {
          // generate 5 addresses for now
          for(var idx=0; idx<5; idx++) {
              $scope.generateAddress(0);
              $scope.generateAddress(1);
          }
      }
  }
  function loadAddresses(identity) {
      /* Load addresses into angular */
      Object.keys(identity.wallet.pubKeys).forEach(function(pubKeyIndex) {
          var walletAddress = identity.wallet.getAddress(pubKeyIndex);
          // Regular addresses
          if (walletAddress.index.length > 1) {
              // add to scope
              var pocketIndex = walletAddress.index[0];
              if (!$scope.addresses[pocketIndex]) {
                  $scope.addresses[pocketIndex] = [];
              }
              var addressArray = $scope.addresses[pocketIndex];
              if ($scope.allAddresses.indexOf(walletAddress) == -1) {
                  addressArray.push(walletAddress);
                  $scope.allAddresses.push(walletAddress);
              }
          }
      });
  }

  function loadIdentity(identity) {
      // set some links
      $scope.identity = identity;
      $scope.history = identity.history.history;
      // set history update callback
      $scope.totalBalance = identity.wallet.getBalance();

      // load addresses into angular
      loadAddresses(identity);

      // initialize if empty wallet
      initializeEmpty();

      // this will connect to obelisk if we're not yet connected
      ngProgress.color('firebrick');
      ngProgress.start();
      console.log("connect");
      bg.connect(function() {
          ngProgress.color('green');
          ngProgress.complete();
      });
      // apply scope changes
      if(!$scope.$$phase) {
          $scope.$apply();
      }
  };

  // scope function to generate (or load from cache) a new address
  $scope.generateAddress = function(isChange, n) {
    if (!isChange) {
        isChange = 0;
    }
    if (!$scope.addresses[isChange]) {
        $scope.addresses[isChange] = [];
    }
    var addressArray = $scope.addresses[isChange];
    if (n === undefined || n === null) {
        n = addressArray.length;
    }
    var walletAddress = $scope.identity.wallet.getAddress([isChange, n]);

    // add to scope
    if ($scope.allAddresses.indexOf(walletAddress) == -1) {
        addressArray.push(walletAddress);
        $scope.allAddresses.push(walletAddress);
    }

    // get history for the new address
    bg.initAddress(walletAddress);
    return walletAddress;
  };

  // get a free change address or a new one
  $scope.getChangeAddress = function() {
    for(var idx=0; $scope.changeAddresses.length; idx++) {
        if ($scope.changeAddresses[idx].balance == 0) {
            return $scope.changeAddresses[idx];
        }
    }
    return $scope.generateAddress(1);
  }

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
              $scope.identity.wallet.processStealth(results, $scope.stealth.password);
              toaster.pop('success', "stealth", "ok")
          } catch (e) {
              toaster.pop('error', "stealth", e.message)
          }
          ngProgress.complete();
      }
      client.fetch_stealth([0,0], stealth_fetched, 0);
  }

  // Test modals
  var TestModalCtrl = function ($scope, $modalInstance) {
    $scope.ok = function () {
      $modalInstance.close();
    };
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  };

  $scope.openModal = function(tplName) {
    return $modal.open({
      templateUrl: tplName,
      controller: TestModalCtrl
    });
  }

  $scope.copyClipboard = function(text) {
    var copyDiv = document.createElement('div');
    copyDiv.contentEditable = true;
    copyDiv.style="position: fixed;";
    document.getElementById('fixed').appendChild(copyDiv);
    copyDiv.innerHTML = text;
    copyDiv.unselectable = "off";
    copyDiv.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    document.getElementById('fixed').removeChild(copyDiv);
  }
  
  $scope.pasteClipboard = function() {
    var pasteDiv = document.createElement('div');
    pasteDiv.contentEditable = true;
    document.getElementById('fixed').appendChild(pasteDiv);
    pasteDiv.innerHTML = '';
    pasteDiv.unselectable = "off";
    pasteDiv.focus();
    document.execCommand("paste");
    var text = pasteDiv.innerText;
    document.getElementById('fixed').removeChild(pasteDiv);
    return text;
  }

  // Load identity
  if (bg.getKeyRing().availableIdentities.length) {
    bg.loadIdentity(0, loadIdentity);
  }
}]);
});