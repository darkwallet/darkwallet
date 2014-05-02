/**
 * @fileOverview WalletCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port'],
function (controllers, DarkWallet, Port) {
  'use strict';

  /**
   * Controller
   */
  controllers.controller('WalletCtrl',
  ['$scope', '$location', 'clipboard', 'modals', '$wallet', '$animate',
      function($scope, $location, clipboard, modals, $wallet, $animate) {

  // Scope variables
  $scope.rates = {};
  $scope.totalBalance = 0;
  $scope.forms = {};
  $scope.identityName = false;

  // Global scope utils
  $scope.modals = modals;
  $scope.clipboard = clipboard;
  
  $animate.enabled(false);

  /**
   * Wallet Port
   * Sends notifications about wallet state and identity change
   */
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
      else if (data.type == 'address') {
          var identity = DarkWallet.getIdentity();
          var walletAddress = identity.wallet.getAddress(data.index);
          if (walletAddress) {
              $wallet.addToScope(walletAddress);
          }
      }
  });


  /**
   * Check if a route is active
   */
  $scope.isActive = function(route) {
    return route === $location.path();
  };


  /**
   * Link given identity to the scope
   */
  function linkIdentity(identity) {
      // Link pockets and funds
      $scope.hdPockets = identity.wallet.pockets.hdPockets;
      $scope.allFunds = identity.wallet.multisig.funds;

      // set some links
      $scope.availableIdentities = DarkWallet.getKeyRing().availableIdentities;
      $scope.settings = identity.settings;

      // get the balance for the wallet
      var balance = $wallet.getBalance();
      
      $scope.totalBalance = balance.confirmed;
      $scope.totalUnconfirmed = balance.unconfirmed;

      $scope.identityName = identity.name;
      
      $animate.enabled(identity.settings.animations.enabled);
  }


  /**
   * Identity loaded, called when a new identity is loaded
   */
  function identityLoaded(identity) {
      if (!identity || $scope.identityName == identity.name) {
          return false;
      }

      if (identity.reseed) {
          $scope.alert = 'reseed';
      }
      $scope.status = DarkWallet.core.servicesStatus;

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

  /**
   * Utility function to create iterators
   */
  $scope.range = function(n) {
      if (!n) return [];
      return new Array(n);
  };


  // Load identity
  // If the identity is not immediately loaded then the callback will
  // not be called  and we get it on the Port.
  $wallet.loadIdentity(identityLoaded);

}]);
});
