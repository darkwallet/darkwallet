'use strict';

define(['./module', 'frontend/port', 'darkwallet'], function (controllers, Port, DarkWallet) {
  controllers.controller('IdentitiesCtrl', ['$scope', '$window', 'modals', 'notify', '_Filter', function($scope, $window, modals, notify, _) {
    Port.connectNg('wallet', $scope, function(data) {
      if (data.type == 'ready' || data.type == 'rename') {
        // identity is ready here
        $scope.currentIdentity = DarkWallet.getIdentity().name;
        DarkWallet.keyring.getIdentities(function(identities) {
            $scope.identities = identities;
            $scope.loadedIdentities = Object.keys($scope.identities);
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });
        DarkWallet.keyring.getIdentityNames(function(availableIdentities) {
            $scope.availableIdentities = availableIdentities;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });
      }
    });

    var deleteCurrentIdentity = function(identityName) {
        var identityIdx = $scope.availableIdentities.indexOf(identityName);
        if ($scope.availableIdentities.length == 1) {
            notify.warning(_('Can\'t delete the last identity!'));
            return;
        }
        var nextIdentity = identityIdx ? 0 : 1;
        DarkWallet.service.obelisk.disconnect(function() {
            DarkWallet.core.loadIdentity(nextIdentity, function() {
                // Delete the identity after a new identity is loaded
                deleteOtherIdentity(identityName);
            });
        });
    };

    var deleteOtherIdentity = function(identityName) {
        DarkWallet.keyring.remove(identityName, function() {
            var identityIdx = $scope.availableIdentities.indexOf(identityName);
            if (identityIdx > -1) {
                $scope.availableIdentities.splice(identityIdx, 1);
            }
            notify.note(_('{0} has been deleted.', identityName));
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });
    };

    var confirmDeleteIdentity = function(identityName) {
        var identity = DarkWallet.getIdentity();
        if (identityName == identity.name) {
            deleteCurrentIdentity(identityName);
        } else {
            deleteOtherIdentity(identityName);
        }
    };

    $scope.deleteIdentity = function(identityName) {
        modals.open('confirm', {message: _('Are you sure you want to delete {0}?', identityName), detail: _('This action can\'t be reverted!')}, function() {
            confirmDeleteIdentity(identityName);
        });
    };

    $scope.selectIdentity = function(identityName) {
        var identityIdx = $scope.availableIdentities.indexOf(identityName);
        DarkWallet.service.obelisk.disconnect(function() {
            DarkWallet.core.loadIdentity(identityIdx);
        });
    };

  }]);
});
