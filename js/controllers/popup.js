/**
 * @fileOverview Popup classes.
 */

/**
 * Popup class constructor to handle identities.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  'use strict';
  controllers.controller('PopupCtrl', ['$scope', function($scope) {
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
    $scope.identityNames = identityNames;
    $scope.identity = $scope.identities[0];
    $scope.identityChange();
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  });
}]);
});
