/**
 * @fileOverview PocketCreateCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  controllers.controller('PocketCreateCtrl', ['$scope', '$wallet', '$history', 'watch', function($scope, $wallet, $history, watch) {

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
    $scope.finalizeRenamePocket = function(pocket, name) {
        if (!pocket || !name) {
            // if empty just toggle visibility
            $scope.forms.pocketLabelForm.$show();
        } else {
            var identity = DarkWallet.getIdentity();
            var walletPocket = identity.wallet.pockets.getPocket($history.pocket.index, $history.pocket.type);
            if (walletPocket.type === 'readonly') {
                // Disable watch also if deleting a watch pocket
                var contact = identity.contacts.search({name: walletPocket.name});
                if (contact && contact.data.watch) {
                    contact.data.name = name;
                    watch.renamePocket(name, walletPocket.name);
                    // update frontend index
                    $scope.updateReadOnly(identity);
                }
            } else if (walletPocket.type === 'multisig') {
                walletPocket.name = name;
                walletPocket.fund.name = name;
            } else {
                // Otherwise just change the name
                walletPocket.name = name;
                walletPocket.store.name = name;
            }
            identity.store.save();
            $scope.pocket.name = name;
            $scope.forms.pocketName = '';
        }
    };

}]);
});
