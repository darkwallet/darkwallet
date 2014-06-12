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
  controllers.controller('PopupCtrl', ['$scope', '$window', function($scope, $window) {

  $scope.identityLoaded = false;
  $scope.currentIdentity = false;
  $scope.connected = false;
  $scope.tab = 0;
  $scope.needsOpen = false;
  
  $scope.forms = {};
  $scope.forms.identityDropdown = false;
  $scope.identityName = false;

  // Wallet service, connect to get notified about identity getting loaded.
  Port.connect('wallet', function(data) {
    if (data.type == 'ready') {
        // identity is ready here
        $scope.identityLoaded = true;
        $scope.currentIdentity = data.identity;
        $scope.identity = DarkWallet.getIdentity();
        $scope.forms.identityDropdown = false;
        $scope.settings = $scope.identity.settings;
        if ($scope.needsOpen) {
            $scope.needsOpen = false;
            $window.open('index.html#wallet');
        }
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
    if (keyRing.identities.hasOwnProperty($scope.currentIdentity)) {
        $scope.identityLoaded = true;
    }
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  });


  $scope.loadIdentity = function(name) {
      var identityIdx = DarkWallet.getKeyRing().availableIdentities.indexOf(name);
      DarkWallet.service.obelisk.disconnect(function() {
          $scope.needsOpen = !$scope.identityLoaded;
          DarkWallet.core.loadIdentity(identityIdx);
      });
  }

}]);
});
