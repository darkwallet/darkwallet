/**
 * @fileOverview Popup classes.
 */

/**
 * Popup class constructor to handle identities.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['frontend/controllers/module', 'darkwallet', 'frontend/services'], function (controllers, DarkWallet, Services) {
  'use strict';
  controllers.controller('PopupCtrl', ['$scope', function($scope) {

  $scope.currentIdentity = false;
  // Wallet service, connect to get notified about identity getting loaded.
  Services.connect('wallet', function(data) {
    console.log("wallet bus message", data);
    if (data.type == 'ready') {
        // identity is ready here
        console.log('loaded', data.identity)
        $scope.currentIdentity = data.identity;
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }
  })


  // we don't have the same background page here, so we initialize our
  // own keyring just for choosing identities, just for now...
  var keyRing = DarkWallet.getKeyRing();
  $scope.identityChange = function() {
    if (!$scope.identity) {
        return;
    }
  };
  keyRing.loadIdentities(function(identityNames) {
    var identities = [];
    identityNames.forEach(function(item) {
      identities.push({id: item});
    });
    $scope.identities = identities;
    if (!$scope.currentIdentity) {
        $scope.currentIdentity = identityNames[0];
    }
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  });
}]);
/**
 * Password class constructor.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
controllers.controller('PasswordCtrl' ['$scope', '$window', function($scope, $window) {

  $scope.submit = function() {
    var keyRing = DarkWallet.keyRing;
    var random = new Uint8Array(16);
    var seed = [];
    var passwd = $scope.passwd;

    $scope.resultShow = true;

    // Check that passwords match.
    if ($scope.passwd != $scope.passwd2) {
      $scope.message = 'Passwords are not the same';
      $scope.pubKey = '';
      $scope.privKey = '';
      return;
    }

    // Fill 'random' array with cryptographically random numbers.
    // Should be done using api from bitcoin-js.
    $window.crypto.getRandomValues(random);

    // Copy the random numbers to our seed array.
    // Why is this needed?
    for (var i in random) {
      seed[i] = random[i];
    }

    // Initializing the key from seed.
    // We save the keys so we don't need access to the seed any more.
    seed = Bitcoin.convert.bytesToString(seed);

    keyRing.createIdentity($scope.name, seed, $scope.passwd);
  };
}]);
});
