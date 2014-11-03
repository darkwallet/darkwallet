'use strict';

define(['./module', 'darkwallet', 'model/upgrade'], function (controllers, DarkWallet, Upgrade) {
  controllers.controller('ReseedCtrl', ['$scope', 'modals', 'notify', '$wallet', '_Filter', function($scope, modals, notify, $wallet, _) {
    $scope.reseedIdentity = function() {
        modals.password('Write your password to reseed. EXPERIMENTAL. You can lose all data.', function(password) {
            var identity = DarkWallet.getIdentity();
            try {
                var res = Upgrade(identity.store.store, identity, password);
            } catch(e) {
                if (e.message.slice(0, 4) === "ccm:") {
                    notify.warning('Bad password');
                } else {
                    notify.error('Fatal error!');
                }
                return;
            }
            if (res) {
                if (identity.store.get('version') === 5) {
                    identity.store.save();
                    $wallet.onIdentityLoaded(identity);
                    notify.success('Reseed successfull');
                    $scope.clearAlert();
                } else {
                    notify.warning('Could not finish reseeding');
                }
            } else {
                notify.warning('Could not reseed');
            }
        });
    };

  }]);
});
