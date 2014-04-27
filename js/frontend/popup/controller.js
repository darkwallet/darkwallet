/**
 * @fileOverview Popup classes.
 */
'use strict';

/**
 * Popup class constructor to handle identities.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['frontend/controllers/module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {
  controllers.controller('PopupCtrl', ['$scope', function($scope) {

  $scope.currentIdentity = false;
  $scope.connected = false;
  
  $scope.forms = {};
  $scope.identityName = false;

  // Wallet service, connect to get notified about identity getting loaded.
  Port.connect('wallet', function(data) {
    if (data.type == 'ready') {
        // identity is ready here
        $scope.currentIdentity = data.identity;
        $scope.identity = DarkWallet.getIdentity();
        $scope.settings = $scope.identity.settings;
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }
  });
  
  Port.connect('obelisk', function(data) {
    if (data.type == 'connected') {
      $scope.connected = true;
    }
  });
  
  Port.connect('gui', function(data) {
    if (['height', 'radar'].indexOf(data.type) > -1) {
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }
  });

  Port.connect('badge', function(data) {
      // just so the service gets disconnected when we close.
  });


  var keyRing = DarkWallet.getKeyRing();
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
