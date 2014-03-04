/**
 * @fileOverview Popup classes.
 */

/**
 * Popup class constructor to handle identities.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
angular.module('DarkWallet.controllers').controller('PopupCtrl', ['$scope', function($scope) {
  // we don't have the same background page here, so we initialize our
  // own keyring just for choosing identities, just for now...
  var keyRing = new IdentityKeyRing();
  keyRing.loadIdentities(function(identityNames) {
    var identities = [];
    identityNames.forEach(function(item) {
      identities.push({id: item});
    });
    $scope.identities = identities;
    $scope.identityNames = identityNames;
    $scope.identity = $scope.identities[0];
    $scope.identityChange();
    $scope.$apply();
  });
  $scope.identityChange = function() {
    if (!$scope.identity) {
        return;
    }
    /*if ($scope.identity.id == $scope.identityNames[0]) {
      $scope.activity = [
        {action: 'Received bitcoins', amount: '0.05', timestamp: '5 minutes ago'},
        {action: 'Received bitcoins', amount: '0.01', timestamp: '6 minutes ago'}
      ];
    } else {
      $scope.activity = [
        {action: 'Received bitcoins', amount: '0.1', timestamp: '15 minutes ago'},
        {action: 'Received bitcoins', amount: '2', timestamp: '26 minutes ago'},
        {action: 'Received bitcoins', amount: '0.2', timestamp: '31 minutes ago'}
      ];
    }*/
  };
}])
/**
 * Password class constructor.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
.controller('PasswordCtrl' ['$scope', function($scope) {

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
    window.crypto.getRandomValues(random);

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
