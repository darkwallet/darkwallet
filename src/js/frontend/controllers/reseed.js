'use strict';

define(['./module', 'darkwallet', 'model/upgrade'], function (controllers, DarkWallet, Upgrade) {
  controllers.controller('ReseedCtrl', ['$scope', 'modals', 'notify', '$wallet', '_Filter', function($scope, modals, notify, $wallet, _) {
    $scope.reseedIdentity = function() {
        modals.password(_('Write your password to reseed.'), function(password) {
            var identity = DarkWallet.getIdentity();
            try {
                var res = Upgrade(identity.store.store, identity, password);
            } catch(e) {
                if (e.message.slice(0, 4) === "ccm:") {
                    notify.warning(_('Invalid Password'));
                } else {
                    console.log(e.stack);
                    console.log(e);
                    notify.error(_('Fatal error!'), e.message);
                }
                return;
            }
            if (res) {
                if (identity.store.get('version') === 6) {
                    identity.store.save();
                    $wallet.onIdentityLoaded(identity);
                    notify.success(_('Reseed successfull'));
                    $scope.clearAlert();
                } else {
                    notify.warning(_('Could not finish reseeding'));
                }
            } else {
                notify.warning(_('Could not reseed'));
            }
        });
    };

  }]);
});
