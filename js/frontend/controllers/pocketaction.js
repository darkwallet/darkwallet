/**
 * @fileOverview PocketActionCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'dwutil/currencyformat', 'sjcl'], function (controllers, DarkWallet, CurrencyFormat, sjcl) {
  controllers.controller('PocketActionCtrl', ['$scope', 'modals', 'notify', '$history', '$location', '_Filter', function($scope, modals, notify, $history, $location, _) {

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
        $scope.forms.pocketName = pocket.name;
        $scope.renamingPocket = true;
    };

    /**
     * Finalize Rename a pocket
     */
    $scope.finalizeRenamePocket = function(pocket, name) {
        if (!pocket || !name || pocket.name === name) {
            // if empty just toggle visibility
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
        }
        $scope.forms.pocketName = '';
        $scope.renamingPocket = false;
    };


    /**
     * Really delete a pocket after confirmation
     */
    $scope.deletePocketFinish = function(pocket) {
        var identity = DarkWallet.getIdentity();
        var oldPocket = $history.removePocket(pocket.type, pocket.index);
        if (oldPocket.type === 'readonly') {
            var contact = identity.contacts.search({name: oldPocket.name});
            if (contact && contact.data.watch) {
                contact.data.watch = false;
            }
            $scope.updateReadOnly(identity);
        }
        $location.path('/wallet');
    };

    /**
     * Toggle the pocket's mixing state
     */
    $scope.setMixing = function(pocket) {
        var identity = DarkWallet.getIdentity();
        var walletPocket = identity.wallet.pockets.getPocket(pocket.index, 'hd');
        var pocketStore = walletPocket.store;
        // Finish setting mixing in the pocket
        // this can happen after requesting the password
        var finishSetMixing = function() {
            pocketStore.mixing = !pocketStore.mixing;
            pocket.mixing = pocketStore.mixing;
            // mixing options
            if (pocket.mixing && !pocketStore.mixingOptions) {
                pocketStore.mixingOptions = {budget: 100000, spent: 0, mixings: 5};
                pocket.mixingOptions = pocketStore.mixingOptions;
            }
            // save store
            identity.wallet.store.save();
            var mixerService = DarkWallet.service.mixer;
            mixerService.checkMixing();
        }

        // We're going to enable mixing so request the password to gather the key for the pocket
        if (!pocketStore.mixing) {
            modals.password(_('Write the password for your pocket'), function(password) {
                var safe = DarkWallet.service.safe;
                var version = identity.store.get('version');
                // get master private for the pockets since the mixer will need them
                var oldPrivKey, privKey, oldChangeKey;
                try {
                    // we get first the master key for new style, and the public branch key for old style
                    if (version > 4) {
                        privKey = walletPocket.getMasterKey(null, password);
                    } else {
                        oldPrivKey = walletPocket.getMasterKey(0, password);
                    }
                } catch(e) {
                    if ($scope.settings.advanced) {
                        notify.warning(_('Invalid password'), e.message || ""+e)
                    } else {
                        notify.warning(_('Invalid Password'))
                    }
                    return;
                }
                if (version < 5 || identity.wallet.oldMpk) {
                    if (version > 4) {
                        oldPrivKey = walletPocket.getMasterKey(0, password);
                    }
                    oldChangeKey = walletPocket.getMasterKey(1, password);
                }

                // Save some session passwords for the mixer
                var pocketPassword = safe.set('mixer', 'pocket:'+pocket.index, password);

                // Save the keys encrypted with the pocket
                if (privKey) {
                    pocketStore.privKey = sjcl.encrypt(pocketPassword, privKey, {ks: 256, ts: 128});
                }

                if (oldPrivKey) {
                    pocketStore.oldPrivKey = sjcl.encrypt(pocketPassword, oldPrivKey, {ks: 256, ts: 128});
                    pocketStore.oldPrivChangeKey = sjcl.encrypt(pocketPassword, oldChangeKey, {ks: 256, ts: 128});
                }

                // Finish setting the pocket mixing state
                finishSetMixing();
            });
        } else {
            // Otherwise ensure we delete any private data from the pocket
            pocketStore.oldPrivKey = undefined;
            pocketStore.oldPrivChangeKey = undefined;
            pocketStore.privKey = undefined;
            finishSetMixing();
        }
    };

    /**
     * Update the form with mixing options
     */
    var updateMixingOptions = function(pocket) {
        if (!$scope.forms.mixingOptions) {
            $scope.forms.mixingOptions = {};
        }
        if (!pocket.mixingOptions) {
            return;
        }
        Object.keys(pocket.mixingOptions).forEach(function(name) {
            $scope.forms.mixingOptions[name] = pocket.mixingOptions[name];
        });
        $scope.forms.mixingOptions.budget = CurrencyFormat.asBtc(pocket.mixingOptions.budget);
    };

    /**
     * Set mixing options
     */
    $scope.setMixingOptions = function(pocket, options) {
        var identity = DarkWallet.getIdentity();
        var walletPocket = identity.wallet.pockets.getPocket(pocket.index, 'hd').store;

        // now set options
        walletPocket.mixingOptions.budget = CurrencyFormat.asSatoshis(parseFloat(options.budget));
        walletPocket.mixingOptions.mixings = parseInt(options.mixings);

        // save
        identity.wallet.store.save();
    };

    // Watch pocket change to update the form
    $scope.$watch('pocket.mixingOptions', function() {
        updateMixingOptions($scope.pocket);
    });


    /**
     * Move funds to another pocket or identity
     */
    $scope.moveFunds = function(type, index) {
        var identity = DarkWallet.getIdentity();
        var wallet = identity.wallet;
        var to;
        var address;
        // generate a destination address
        var pocket = wallet.pockets.getPocket(index, type);
        if (pocket) {
            to = pocket.name;
            address = pocket.getFreeAddress().address;
        } else {
            throw Error(_('Invalid type while moving funds!'));
        }

        // Prepare transaction

        var fee = wallet.fee;
        var amount = $scope.pocket.balance.confirmed - fee;

        var recipients = [{amount: amount, address: address}];
        var metadata = identity.tx.prepare($scope.pocket.index, recipients, null, fee);
 
        // Request password for signing
        var message = _('Are you sure you want to move all {0} funds to {1}?', $scope.pocket.name, to);
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
                   notify.success(_('Funds sent to {0}', to));
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
