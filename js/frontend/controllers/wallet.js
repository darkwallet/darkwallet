/**
 * @fileOverview Wallet classes.
 */

/**
 * Wallet constructor class.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['./module', 'darkwallet', 'frontend/port'],
function (controllers, DarkWallet, Port) {
  'use strict';
  controllers.controller('WalletCtrl',
  ['$scope', '$location', 'notify', 'clipboard', 'modals', '$timeout',
   function($scope, $location, notify, clipboard, modals, $timeout) {
  var pubKey, mpKey, addressIndex;

  // Pointer to service
  var bg = DarkWallet.core();
  $scope.rates = {};
  $scope.allAddresses = [];
  $scope.totalBalance = 0;
  $scope.forms = {};

  // Global scope utils
  // TODO: Remove functions in scope
  modals.registerScope($scope);
  clipboard.registerScope($scope);

  // Gui service, connect to report events on page.
  Port.connectNg('gui', $scope, function(data) {
    // console.log('[WalletCtrl] gui bus:', data.type, data.text);
    if (data.type == 'balance') {
    }
    if (data.type == 'height') {
        $scope.currentHeight = data.value;
    }
    if (data.type == 'text' || data.type == 'note') {
        notify.note('gui', data.text);
    }
    if (data.type == 'error') {
        notify.error(data.title || 'gui', data.text);
    }
    if (data.type == 'warning') {
        notify.warning('gui', data.text);
    }
    if (['height', 'update', 'balance'].indexOf(data.type) > -1) {
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    }
  })

  // Obelisk service, connect to get notified on events and connection.
  Port.connectNg('obelisk', $scope, function(data) {
    console.log("[WalletCtrl] obelisk bus:", data.type);
    if (data.type == 'connected') {
        var identity = DarkWallet.getIdentity();
        notify.success('connected', identity.connections.servers[identity.connections.selectedServer].name);
        //notify.progress.color('green');
        //notify.progress.complete();
    } else if (data.type == 'disconnected') {
        var identity = DarkWallet.getIdentity();
        notify.warning('disconnected', identity.connections.servers[identity.connections.selectedServer].name);
            $scope.$apply();
    } else if (data.type == 'connectionError') {
        notify.error("Error connecting", data.error)
        //notify.progress.color('red');
        //notify.progress.complete();
    }
  })

  // Wallet service, connect to get notified about identity getting loaded.
  Port.connectNg('wallet', $scope, function(data) {
    console.log("[WalletCtrl] wallet bus:", data.type);
    if (data.type == 'ready') {
        // identity is ready here
        loadIdentity(DarkWallet.getIdentity())
    }
    if (data.type == 'ticker') {
        $scope.rates[data.currency] = data.rate;
    }
  })


  // Check if a route is active
  $scope.isActive = function(route) {
    return route === $location.path();
  }

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
          // Init pockets
          for(var idx=0; idx<identity.wallet.pockets.hdPockets.length; idx++) {
              $scope.initPocket(idx);
          };
          // Regular addresses
          if (walletAddress.index.length > 1) {
              // add to scope
              var branchId = walletAddress.index[0];
              if (!$scope.addresses[branchId]) {
                  $scope.addresses[branchId] = [];
              }
              var addressArray = $scope.addresses[branchId];
              if ($scope.allAddresses.indexOf(walletAddress) == -1) {
                  addressArray.push(walletAddress);
                  $scope.allAddresses.push(walletAddress);
              }
          }
      });
  }

  function loadIdentity(identity) {
      $scope.addresses = {};
      $scope.allAddresses.splice(0,$scope.allAddresses.length);
      // set some links
      $scope.identity = identity;
      $scope.availableIdentities = bg.getKeyRing().availableIdentities;
      $scope.history = identity.history.history;
      // set history update callback
      $scope.totalBalance = identity.wallet.getBalance();
      $scope.selectedCurrency = identity.settings.currency;
      $scope.selectedFiat = identity.settings.fiatCurrency;
      $scope.defaultFee = identity.wallet.fee / 100000000;

      // load addresses into angular
      loadAddresses(identity);

      // initialize if empty wallet
      initializeEmpty();

      // this will connect to obelisk if we're not yet connected
      //notify.progress.color('firebrick');
      //notify.progress.start();
      if (bg.getClient() && bg.getClient().connected) {
          // If already connected set the progress bar to finish
          // we wait a moment to provide better visual feedback
          /*$timeout(function() {
              notify.progress.color('green');
              notify.progress.complete();
          }, 500);*/
      } else {
          // Request connecting to blockchain
          setTimeout(function() {
            bg.connect();
          })
      }
      console.log("[WalletCtrl] loadIdentity", identity.name);
      // apply scope changes
      /*if(!$scope.$$phase) {
          $scope.$apply();
      }*/
  };

  // Initialize pocket structures.
  $scope.initPocket = function(pocketId) {
      var branchId = pocketId*2;
      if (!$scope.addresses[branchId]) {
          $scope.addresses[branchId] = [];
      }
      if (!$scope.addresses[branchId+1]) {
          $scope.addresses[branchId+1] = [];
      }
  }

  // Add a wallet address to scope
  var addToScope = function(walletAddress) {
    var branchId = walletAddress.index[0];
    var addressArray = $scope.addresses[branchId];
    if ($scope.allAddresses.indexOf(walletAddress) == -1) {
        addressArray.push(walletAddress);
        $scope.allAddresses.push(walletAddress);
    }
  }

  // scope function to generate (or load from cache) a new address
  $scope.generateAddress = function(branchId, n) {
    if (!branchId) {
        branchId = 0;
    }
    if (!$scope.addresses[branchId]) {
        $scope.addresses[branchId] = [];
    }
    var addressArray = $scope.addresses[branchId];
    if (n === undefined || n === null) {
        n = addressArray.length;
    }
    var walletAddress = $scope.identity.wallet.getAddress([branchId, n]);

    // add to scope
    addToScope(walletAddress);

    // get history for the new address
    bg.initAddress(walletAddress);
    return walletAddress;
  };

  // get a free change address or a new one
  $scope.getChangeAddress = function(pocketId) {
    var identity = DarkWallet.getIdentity();
    if (!pocketId) pocketId = 0;
    var changeAddress = identity.wallet.getChangeAddress(pocketId);
    addToScope(changeAddress);
    return changeAddress;
  }

  // Load identity
  if (bg.getKeyRing().availableIdentities.length && !bg.getIdentity()) {
    bg.loadIdentity(0);
  }
}]);
});
