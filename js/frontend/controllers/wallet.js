/**
 * @fileOverview Wallet classes.
 */
'use strict';

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

  var prevIdentity = false;
  var closingConnection = false;

  // Pointer to service
  var bg = DarkWallet.core;
  $scope.rates = {};
  $scope.allAddresses = [];
  $scope.totalBalance = 0;
  $scope.forms = {};
  $scope.identityName = '';

  // Global scope utils
  // TODO: Remove functions in scope
  modals.registerScope($scope);
  clipboard.registerScope($scope);

  // Gui service, connect to report events on page.
  Port.connectNg('gui', $scope, function(data) {
    // console.log('[WalletCtrl] gui bus:', data.type, data.text);
    if (data.type == 'balance') {
    }
    else if (data.type == 'height') {
        $scope.currentHeight = data.value;
    }
    else if (data.type == 'text' || data.type == 'note') {
        notify.note('gui', data.text);
    }
    else if (data.type == 'error') {
        notify.error(data.title || 'gui', data.text);
    }
    else if (data.type == 'warning') {
        notify.warning('gui', data.text);
    }
    if (['height', 'update'].indexOf(data.type) > -1) {
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    }
  });

  // Obelisk service, connect to get notified on events and connection.
  Port.connectNg('obelisk', $scope, function(data) {
    if (data.type == 'connected') {
        var identity = DarkWallet.getIdentity();
        closingConnection = false;
        notify.success('connected', identity.connections.servers[identity.connections.selectedServer].name);
    }
    else if (data.type == 'disconnect') {
        closingConnection = true;
    } else if (data.type == 'disconnected' && !closingConnection) {
        var identity = DarkWallet.getIdentity();
        notify.warning('disconnected', identity.connections.servers[identity.connections.selectedServer].name);
            $scope.$apply();
    } else if (data.type == 'connectionError') {
        notify.error("Error connecting", data.error);
    }
  });

  // Wallet service, connect to get notified about identity getting loaded.
  Port.connectNg('wallet', $scope, function(data) {
    if (data.type == 'ready') {
        loadIdentity(DarkWallet.getIdentity());
        if(!$scope.$$phase && prevIdentity && prevIdentity != data.identity) {
            $scope.$apply();
        }
        $scope.identityName = data.identity;
        prevIdentity = data.identity;
    }
    else if (data.type == 'ticker') {
        $scope.rates[data.currency] = data.rate;
    }
  });


  // Check if a route is active
  $scope.isActive = function(route) {
    return route === $location.path();
  };

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

  var initialized;

  function loadIdentity(identity) {
      if (!identity || initialized == identity.name) {
          return;
      }
      initialized = identity.name;
      $scope.addresses = {};
      $scope.allAddresses.splice(0,$scope.allAddresses.length);
      // set some links
      //$scope.identity = identity;
      $scope.availableIdentities = bg.getKeyRing().availableIdentities;
      // $scope.history = identity.history.history;
      // set history update callback
      var balance = identity.wallet.getBalance();
      
      $scope.totalBalance = balance.confirmed;
      $scope.totalUnconfirmed = balance.unconfirmed;
      $scope.selectedCurrency = identity.settings.currency;
      $scope.selectedFiat = identity.settings.fiatCurrency;
      $scope.defaultFee = identity.wallet.fee / 100000000;

      // load addresses into angular
      loadAddresses(identity);

      // initialize if empty wallet
      initializeEmpty();

      // this will connect to obelisk if we're not yet connected
      if (bg.getClient() && bg.getClient().connected) {
          // Already connected, set height
          $scope.currentHeight = DarkWallet.service.wallet.currentHeight;
      } else {
          // Request connecting to blockchain
          setTimeout(function() {
            bg.connect();
          });
      }
      console.log("[WalletCtrl] loadIdentity", identity.name);
      // apply scope changes
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
  };

  // Add a wallet address to scope
  var addToScope = function(walletAddress) {
    var branchId = walletAddress.index[0];
    var addressArray = $scope.addresses[branchId];
    if ($scope.allAddresses.indexOf(walletAddress) == -1) {
        addressArray.push(walletAddress);
        $scope.allAddresses.push(walletAddress);
    }
  };
  $scope.addToScope = addToScope;

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
    var walletAddress = DarkWallet.getIdentity().wallet.getAddress([branchId, n]);

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
  };

  // Load identity
  var identity = DarkWallet.getIdentity();
  if (identity) {
      loadIdentity(identity);
  } else {
      if (bg.getKeyRing().availableIdentities.length) {
        bg.loadIdentity(0);
      }
  }

}]);
});
