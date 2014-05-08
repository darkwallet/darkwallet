/**
 * @fileOverview PocketActionCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'sjcl'], function (controllers, DarkWallet) {
  controllers.controller('PocketActionCtrl', ['$scope', 'modals', 'notify', function($scope, modals, notify) {

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
                try {
                    var privKey = identity.wallet.getPocketPrivate(pocketIndex*2, password);
                } catch(e) {
                    if ($scope.settings.advanced) {
                        notify.warning("Invalid password", e.message || ""+e)
                    } else {
                        notify.warning("Invalid Password")
                    }
                    return;
                }
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
        var to;
        var address;
        if (type === 'pocket') {
            to = wallet.pockets.hdPockets[index].name;
            address = wallet.getFreeAddress(index*2).address;
        } else if (type === 'multisig') {
            to = wallet.multisig.funds[index].name;
            address = wallet.getFreeAddress(index).address;
        } else {
            throw Error('Invalid type while moving funds!');
        }

        // Prepare transaction

        var fee = wallet.fee;
        var amount = $scope.pocket.balance.confirmed - fee;

        var recipients = [{amount: amount, address: address}];
        var metadata = wallet.prepareTx($scope.pocket.index, recipients, null, fee);
 
        // Request password for signing
        var message = "Are you sure you want to move all ";
        message += $scope.pocket.name + " funds to " + to + "?";
        modals.password(message, function(password) {
           // Sign and broadcast
           var walletService = DarkWallet.service.wallet;
           var sent = false;
           walletService.signTransaction(metadata.tx, metadata, password, function(err, count) {
               if (err) {
                   notify.error(err.message || ""+err);
               }
               if (count>0.2 && !sent) {
                   sent = true;
                   notify.success('Funds sent to ' + to);
                   if (!$scope.$$phase) {
                       $scope.apply();
                   }
               }
               console.log("broadcast", count);
           }, true);
        });
    };

}]);
});
