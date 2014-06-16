'use strict';

define(['./module', 'frontend/port', 'darkwallet'], function (controllers, Port, DarkWallet) {
  controllers.controller('IdentitiesCtrl', ['$scope', '$window', 'modals', 'notify', function($scope, $window, modals, notify) {
    Port.connectNg('wallet', $scope, function(data) {
      if (data.type == 'ready' || data.type == 'rename') {
        // identity is ready here
        $scope.currentIdentity = DarkWallet.getIdentity().name;
        $scope.identities = DarkWallet.getKeyRing().identities;
        $scope.loadedIdentities = Object.keys($scope.identities);
        $scope.availableIdentities = DarkWallet.getKeyRing().availableIdentities;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
      }
    });

    var deleteCurrentIdentity = function(identityName) {
        var identityIdx = $scope.availableIdentities.indexOf(identityName);
        if ($scope.availableIdentities.length == 1) {
            notify.warning("Can't delete the last identity!");
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
        var keyRing = DarkWallet.getKeyRing();
        keyRing.remove(identityName, function() {
            var identityIdx = $scope.availableIdentities.indexOf(identityName);
            if (identityIdx > -1) {
                $scope.availableIdentities.splice(identityIdx, 1);
            }
            notify.note(identityName + " has been deleted.");
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
        modals.open('confirm', {message: 'Are you sure you want to delete ' + identityName + '?', detail: "This action can't be reverted!"}, function() {
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
