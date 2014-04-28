/**
 * @fileOverview PocketActionCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'bitcoinjs-lib', 'sjcl'], function (controllers, DarkWallet, Bitcoin) {
  controllers.controller('PocketActionCtrl', ['$scope', 'modals', function($scope, modals) {

    /**
     * Delete pocket
     */
    $scope.deletePocket = function(pocket) {
        modals.open('confirm-delete', {name: pocket.name, object: pocket}, $scope.deletePocketFinish)
    };

    /**
     * Rename a pocket
     */
    $scope.renamePocket = function(pocket) {
        // continues in PocketCreateCtrl
        $scope.forms.pocketLabelForm.$show();
    };

    /**
     * Really delete a pocket after confirmation
     */
    $scope.deletePocketFinish = function(pocket) {
        var identity = DarkWallet.getIdentity();
        identity.wallet.pockets.deletePocket(pocket.name);
        $scope.selectPocket();
    };

    /**
     * Toggle the pocket's mixing state
     */
    $scope.setMixing = function(pocket) {
        var identity = DarkWallet.getIdentity();
        var walletPocket = identity.wallet.pockets.getPocket(pocket.name);
        // Finish setting mixing in the pocket
        // this can happen after requesting the password
        var finishSetMixing = function() {
            walletPocket.mixing = !walletPocket.mixing;
            pocket.mixing = walletPocket.mixing;
            identity.wallet.store.save();
            var mixerService = DarkWallet.service.mixer;
            mixerService.checkMixing();
        }

        // We're going to enable mixing so request the password to gather the key for the pocket
        if (!walletPocket.mixing) {
            var pocketIndex = identity.wallet.pockets.hdPockets.indexOf(walletPocket);
            modals.password('Write the password for your pocket', function(password) {
                var safe = DarkWallet.service.safe;
                // get master private for the pockets since the mixer will need them
                var privKey = identity.wallet.getPocketPrivate(pocketIndex*2, password);
                var changeKey = identity.wallet.getPocketPrivate((pocketIndex*2)+1, password);

                // Save some session passwords for the mixer
                var pocketPassword = safe.set('mixer', 'pocket:'+pocketIndex, password);

                // Save the keys encrypted with the pocket
                walletPocket.privKey = sjcl.encrypt(pocketPassword, privKey, {ks: 256, ts: 128});
                walletPocket.privChangeKey = sjcl.encrypt(pocketPassword, changeKey, {ks: 256, ts: 128});

                // Finish setting the pocket mixing state
                finishSetMixing();
            });
        } else {
            // Otherwise ensure we delete any private data from the pocket
            walletPocket.privKey = undefined;
            walletPocket.privChangeKey = undefined;
            finishSetMixing();
        }
    };

    /**
     * Move funds to another pocket or identity
     */
    $scope.moveFunds = function(type, index) {
        var wallet = DarkWallet.getIdentity().wallet;
        var walletService = DarkWallet.service.wallet;
        var to;
        var address;
        if (type === 'pocket') {
            to = wallet.pockets.hdPockets[index].name;
            address = wallet.getFreeAddress(index).address;
        } else if (type === 'multisig') {
            to = wallet.multisig.funds[index].name;
            address = wallet.getFreeAddress(index).address;
        } else {
            to = $scope.availableIdentities[index];
            address = '';
        }
        var message = "Are you sure you want to move all ";
        message += $scope.pocket.name + " funds to " + to + "?"
        modals.password(message, function(password) {
            var fee = wallet.store.get('fee');
            var amount = wallet.getBalance($scope.pocket.index).confirmed - fee;
            /*walletService.send($scope.pocket.index, [{amount: amount, address: address}], null, fee, true, function() {
                console.log('Not implemented yet.');
            });*/
        });
    };

}]);
});
