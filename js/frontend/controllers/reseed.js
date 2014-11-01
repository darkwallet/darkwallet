'use strict';

define(['./module', 'darkwallet', 'model/upgrade'], function (controllers, DarkWallet, Upgrade) {
  controllers.controller('ReseedCtrl', ['$scope', 'modals', 'notify', '_Filter', function($scope, modals, notify, _) {
    $scope.reseedIdentity = function() {
        var identity = DarkWallet.getIdentity();
        modals.password('Write your password to reseed', function(password) {
            notify.warning('Not reseeding yet');
            $scope.clearAlert();
            return;
            if (Upgrade(identity.store.store, identity, password)) {
                if (identity.store.get('version') === 5) {
                    identity.store.save();
                    notify.warning('Reseed successfull ' + identity.store.get('version'));
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
