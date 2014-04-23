/**
 * @fileOverview PocketCreateCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  controllers.controller('PocketCreateCtrl', ['$scope', '$wallet', function($scope, $wallet) {

    /**
     * Scope variables
     */
    $scope.newPocket = {};
    $scope.creatingPocket = false;


    /**
     * Create a pocket
     */
    $scope.createPocket = function() {
        if ($scope.creatingPocket && $scope.newPocket.name) {
            var identity = DarkWallet.getIdentity();

            // create pocket
            identity.wallet.pockets.createPocket($scope.newPocket.name);
            var pocketIndex = identity.wallet.pockets.hdPockets.length-1;

            // initialize pocket on angular
            $wallet.initPocket(pocketIndex);

            // generate an address
            $wallet.generateAddress(pocketIndex*2, 0);

            // select the pocket
            $scope.selectPocket($scope.newPocket.name, pocketIndex);

            // reset pocket form
            $scope.newPocket = {name:''};
        }
        $scope.creatingPocket = !$scope.creatingPocket;
    };

    /**
     * Rename a pocket
     */
    $scope.finalizeRenamePocket = function(pocket) {
        if (!pocket || !pocket.name) {
            // if empty just toggle visibility
            $scope.forms.pocketLabelForm.$show();
        } else {
            var identity = DarkWallet.getIdentity();
            identity.store.save();
            $wallet.pocket.name = pocket.name;
        }
    };

}]);
});
