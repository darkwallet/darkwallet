'use strict';

define(['./module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {
  controllers.controller('DashboardCtrl', ['$scope', function($scope) {
    $scope.dashboard = {};

    Port.connectNg('wallet', $scope, function(data) {
        if (data.type == 'ready') {
            var identity = DarkWallet.getIdentity();
            $scope.dashboard.address = identity.wallet.getFreeAddress(0).address;
            if(!$scope.$$phase) {
                $scope.$apply();
            }
        }
    });


  }]);
});
