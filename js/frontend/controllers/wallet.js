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
  ['$scope', '$location', 'notify', 'clipboard', 'modals', '$timeout', '$wallet',
   function($scope, $location, notify, clipboard, modals, $timeout, $wallet) {

  // tabs store
  $scope.tabs = {};

  // Scope variables
  $scope.rates = {};
  $scope.allAddresses = [];
  $scope.totalBalance = 0;
  $scope.forms = {};
  $scope.identityName = false;

  // Global scope utils
  modals.registerScope($scope);
  clipboard.registerScope($scope);

  // Wallet service, connect to get notified about identity getting loaded.
  Port.connectNg('wallet', $scope, function(data) {
      if (data.type == 'ready') {
          var updated = identityLoaded(DarkWallet.getIdentity());
          if(updated && !$scope.$$phase) {
              $scope.$apply();
          }
      }
      else if (data.type == 'height') {
          $scope.currentHeight = data.value;
      }
      else if (data.type == 'ticker') {
          $scope.rates[data.currency] = data.rate;
      }
  });

  // Initialize pocket structures.
  $scope.initPocket = function(pocketId) {
      $wallet.initPocket(pocketId);
  };

  // Add a wallet address to scope
  $scope.addToScope = function(walletAddress) {
      $wallet.addToScope(walletAddress);
  };

  $scope.generateAddress = function(branchId, n) {
      return $wallet.generateAddress(branchId, n);
  }

  $scope.getChangeAddress = function(pocketId) {
      return $wallet.getChangeAddress(pocketId);
  }

  // Check if a route is active
  $scope.isActive = function(route) {
    return route === $location.path();
  };

  /**
   * Link given identity to the scope
   */
  function linkIdentity(identity) {
      // Clear addresses arrays
      $scope.addresses = $wallet.addresses;
      $scope.allAddresses = $wallet.allAddresses;

      // Link pockets and funds
      $scope.hdPockets = identity.wallet.pockets.hdPockets;
      $scope.allFunds = identity.wallet.multisig.funds;

      // set some links
      $scope.availableIdentities = DarkWallet.getKeyRing().availableIdentities;

      // get the balance for the wallet
      var balance = $wallet.getBalance();
      
      $scope.totalBalance = balance.confirmed;
      $scope.totalUnconfirmed = balance.unconfirmed;
      $scope.selectedCurrency = identity.settings.currency;
      $scope.selectedFiat = identity.settings.fiatCurrency;
      $scope.defaultFee = identity.wallet.fee / 100000000;
      $scope.identityName = identity.name;
  }

  /**
   * Identity loaded, called when a new identity is loaded
   */
  function identityLoaded(identity) {
      if (!identity || $scope.identityName == identity.name) {
          return false;
      }

      // Inform the wallet service
      $wallet.onIdentityLoaded(identity);

      // Link some variables from the identity to scope
      linkIdentity(identity);

      // this will connect to obelisk if we're not yet connected
      if (DarkWallet.getClient() && DarkWallet.getClient().connected) {
          // Already connected, set height
          $scope.currentHeight = DarkWallet.service.wallet.currentHeight;
      } else {
          // Request connecting to blockchain
          setTimeout(function() {
            DarkWallet.core.connect();
          });
      }
      console.log("[WalletCtrl] loadIdentity", identity.name);
      // apply scope changes
      return true;
  };


  // Load identity
  // If the identity is not immediately loaded then the callback will
  // not be called  and we get it on the Port.
  $wallet.loadIdentity(identityLoaded);

}]);
});
