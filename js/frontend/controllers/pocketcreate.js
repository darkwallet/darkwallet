/**
 * @fileOverview PocketCreateCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  controllers.controller('PocketCreateCtrl', ['$scope', '$wallet', '$history', 'watch', '$tabs', 'modals', function($scope, $wallet, $history, watch, $tabs, modals) {

    /**
     * Scope variables
     */
    $scope.newPocket = {};


    /**
     * Create a pocket
     */
    $scope.createPocket = function() {
        if ($scope.newPocket.name) {
            var identity = DarkWallet.getIdentity();
            // Don't need the password for old style
            var askPassword = (identity.store.get('version') > 4) ? modals.password : function(title, cb) {cb();};
            askPassword('Write your unlock password', function(password) {

                // create pocket
                identity.wallet.pockets.createPocket($scope.newPocket.name, password);
                var pocketIndex = identity.wallet.pockets.hdPockets.length-1;

                // initialize pocket on angular
                $wallet.initPocket(pocketIndex);

                // generate an address
                $wallet.generateAddress(pocketIndex*2, 0);

                // select the pocket
                $scope.selectPocket($scope.newPocket.name, pocketIndex);

                // reset pocket form
                $scope.newPocket = {name:''};
            });
        } else {
            // cancel
            $tabs.open();
        }
    };
}]);
});
