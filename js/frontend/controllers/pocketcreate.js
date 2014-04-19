/**
 * @fileOverview PocketCreateCtrl angular controller
 */

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  'use strict';
  controllers.controller('PocketCreateCtrl', ['$scope', function($scope) {

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
            $scope.initPocket(pocketIndex);

            // generate an address
            $scope.generateAddress(pocketIndex, 0);

            // select the pocket
            $scope.selectPocket($scope.newPocket.name, pocketIndex);

            // reset pocket form
            $scope.newPocket = {name:''};
        }
        $scope.creatingPocket = !$scope.creatingPocket;
    };

}]);
});
