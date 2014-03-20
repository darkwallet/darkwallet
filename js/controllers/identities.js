define(['./module', 'util/services', 'darkwallet'], function (controllers, Services, DarkWallet) {
  'use strict';
  controllers.controller('IdentitiesCtrl', ['$scope', function($scope) {
    Services.connectNg('wallet', $scope, function(data) {
      console.log("wallet bus message", data);
      if (data.type == 'ready') {
        // identity is ready here
        console.log('loaded', data.identity)
        $scope.identities = DarkWallet.getKeyRing().identities;
      }
    })

  }]);
});
