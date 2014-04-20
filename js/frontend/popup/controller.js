/**
 * @fileOverview Popup classes.
 */

/**
 * Popup class constructor to handle identities.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['frontend/controllers/module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {
  'use strict';
  controllers.controller('PopupCtrl', ['$scope', function($scope) {

  $scope.currentIdentity = false;

  // Wallet service, connect to get notified about identity getting loaded.
  Port.connect('wallet', function(data) {
    if (data.type == 'ready') {
        // identity is ready here
        $scope.currentIdentity = data.identity;
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }
  });

  Port.connect('gui', function(data) {
    if (data.type == 'height') {
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }
  });


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
});
