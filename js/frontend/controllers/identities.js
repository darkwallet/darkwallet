'use strict';

define(['./module', 'frontend/port', 'darkwallet', 'sjcl'], function (controllers, Port, DarkWallet) {
  controllers.controller('IdentitiesCtrl', ['$scope', '$window', function($scope, $window) {
    Port.connectNg('wallet', $scope, function(data) {
      if (data.type == 'ready') {
        // identity is ready here
        $scope.currentIdentity = DarkWallet.getIdentity().name;
        $scope.identities = DarkWallet.getKeyRing().identities;
        $scope.loadedIdentities = Object.keys($scope.identities);
        $scope.availableIdentities = DarkWallet.getKeyRing().availableIdentities;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
      }
    });

    $scope.selectIdentity = function(identityName) {
        var identityIdx = $scope.availableIdentities.indexOf(identityName);
        DarkWallet.core.loadIdentity(identityIdx);
    };

  }]);
});
