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
  ['$scope', '$location', 'clipboard', 'modals', '$wallet', '$animate', '$tabs', '$translate',
      function($scope, $location, clipboard, modals, $wallet, $animate, $tabs, $translate) {

  // Scope variables
  $scope.rates = {};
  $scope.totalBalance = 0;
  $scope.forms = {readOnlyArray: []};
  $scope.identityName = false;

  $scope.allReadOnly = {};

  // Global scope utils
  $scope.modals = modals;
  $scope.clipboard = clipboard;

  $scope.openWallet = $tabs.openWallet;

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
      else if (data.type == 'rename') {
          $scope.identityName = data.newName;
          DarkWallet.keyring.getIdentityNames(function(availableIdentities) {
              $scope.availableIdentities = availableIdentities;
          });
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
    return route === $location.path().slice(0, route.length);
  };

  $scope.updateReadOnly = function(identity) {
      $scope.allReadOnly = identity.wallet.pockets.pockets.readonly;
      this.updateReadOnlyPockets(identity);
  };

  $scope.updateReadOnlyPockets = function(identity) {
      $scope.forms.readOnlyArray.splice(0, $scope.forms.readOnlyArray.length);
      var keys = Object.keys($scope.allReadOnly);
      keys.forEach(function(pocketId) {
          $scope.forms.readOnlyArray.push($scope.allReadOnly[pocketId]);
      });
  };

  /**
   * Link given identity to the scope
   */
  function linkIdentity(identity) {
      // Link pockets and funds
      $scope.hdPockets = identity.wallet.pockets.hdPockets;
      $scope.allFunds = identity.wallet.multisig.funds;

      // Sync read only pockets
      $scope.updateReadOnly(identity);

      // set some links
      DarkWallet.keyring.getIdentityNames(function(availableIdentities) {
          $scope.availableIdentities = availableIdentities;
      });
      $scope.settings = identity.settings;

      // get the balance for the wallet
      var balance = identity.wallet.getBalance();

      $scope.totalBalance = balance.confirmed;
      $scope.totalUnconfirmed = balance.unconfirmed;

      $scope.identityName = identity.name;

      $animate.enabled(identity.settings.animations.enabled);

      $translate.use(identity.settings.language);

  }

  $scope.$watch('allReadOnly', function() {
      var identity = DarkWallet.getIdentity();
      if (identity) {
          // not ready yet
          $scope.updateReadOnlyPockets(identity);
      }

  });

  $scope.clearAlert = function() {
      $scope.alert = false;
  };

  /**
   * Identity loaded, called when a new identity is loaded
   */
  function identityLoaded(identity) {
      if (!identity || $scope.identityName == identity.name) {
          return false;
      }

      DarkWallet.core.isApiUpdated(DarkWallet.apiVersion, function(isUpdated) {
          $scope.alert = !isUpdated ? 'api' : $scope.alert;
      });

      if (identity.reseed) {
          $scope.alert = 'reseed';
      } else {
          $scope.alert = false;
      }
      DarkWallet.core.getServicesStatus(function(servicesStatus) {
          $scope.status = servicesStatus;
      });

      // Inform the wallet service
      $wallet.onIdentityLoaded(identity);

      // Link some variables from the identity to scope
      linkIdentity(identity);

      // this will connect to obelisk if we're not yet connected
      DarkWallet.client.is_connected(function(is_connected) {
          if (is_connected) {
              // Already connected, set height
              $scope.currentHeight = DarkWallet.service.wallet.currentHeight;
          } else {
              // Request connecting to blockchain
              setTimeout(function() {
                  DarkWallet.core.connect();
              });
          }
      });
      console.log("[WalletCtrl] loadIdentity", identity.name);
      // apply scope changes
      return true;
  }

  /**
   * Click on the title either toggles pocket list or goes to wallet
   */
  $scope.titleClick = function() {
      var currentPath = $location.path();
      if (currentPath.substr(0, 7) === '/wallet') {
          var element = angular.element(document.querySelector('.inner-wrap'));
          element.toggleClass('pinned');
          //var element = angular.element(document.querySelector('.off-canvas-wrap'));
          //element.toggleClass('move-right');
      } else {
          $location.path("/wallet");
      }
  }

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
