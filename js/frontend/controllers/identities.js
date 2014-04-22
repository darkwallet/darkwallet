'use strict';

define(['./module', 'frontend/port', 'darkwallet', 'sjcl'], function (controllers, Port, DarkWallet) {
  controllers.controller('IdentitiesCtrl', ['$scope', function($scope) {
    Port.connectNg('wallet', $scope, function(data) {
      if (data.type == 'ready') {
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

    $scope.selectIdentity = function(identityName) {
        var identityIdx = $scope.availableIdentities.indexOf(identityName);
        DarkWallet.core.loadIdentity(identityIdx);
    };

    /**
     * Backups
     */
    function download(filename, text) {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);
        pom.click();
    }

    $scope.backupIdentity = function(identityName) {
        $scope.openModal('ask-password', {text: 'Password for encrypting the backups', password: ''}, function(password) {
            var keyRing = DarkWallet.getKeyRing();
            keyRing.getRaw(identityName, function(obj) {
                var fileName = identityName || 'all';
                download('darkwallet-'+fileName+'.json', sjcl.encrypt(password, JSON.stringify(obj), {ks: 256, ts: 128}));
            });
        });
    };
 

  }]);
});
