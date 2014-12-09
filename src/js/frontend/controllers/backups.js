/**
 * Backups
 */
'use strict';

define(['./module', 'darkwallet', 'bitcoinjs-lib', 'sjcl'], function (controllers, DarkWallet, Bitcoin) {
  controllers.controller('BackupsCtrl', ['$scope', '$window', 'notify', 'modals', '_Filter', function($scope, $window, notify, modals, _) {

    /**
     * Export
     */

    function download(filename, text) {
        var pom = $window.document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);
        pom.click();
    }

    $scope.backupIdentity = function(identityName) {
        modals.password(_('Password for encrypting the backups'), function(password) {
            var keyRing = DarkWallet.getKeyRing();
            keyRing.getRaw(identityName, function(obj) {
                var fileName = identityName || 'all';
                download('darkwallet-'+fileName+'.json', sjcl.encrypt(password, JSON.stringify(obj), {ks: 256, ts: 128}));
            });
        });
    };


    /**
     * Import
     */

    // Link for angular, we will put some information here
    $scope.importFile = {};

    // Private link to our contents
    var backupFile;


    /**
     * Callback for file selection
     */
    var handleFileSelect = function(data) {
        var fileDiv = $window.document.getElementById('import-wallet-file');
        var file = fileDiv.files[0];
        if (!file) {
            return;
        }
        $scope.step = 'unlock';
        $scope.importFile.name = file.name;
        $scope.importFile.size = (file.size/1024).toFixed(1);
        var reader = new FileReader();

        reader.onload = function(data) {
            // TODO: perform sanity checks
            backupFile = data.target.result;
            $scope.fileLoaded = true;
        };

        reader.readAsText(file);
        $scope.$apply();
    };

    var unlockedData = {};

    /**
     * Load a backup, called once for each identity.
     */
    var loadBackup = function(identity) {
        var running = DarkWallet.getIdentity();
        var keyRing = DarkWallet.getKeyRing();
        if (identity.name == running.name) {
            var walletService = DarkWallet.service.wallet;
            walletService.reloadIdentity(identity, function() {
                DarkWallet.core.connect();
            });
        } else {
            keyRing.save(identity.name, identity, function(){ });
            if (keyRing.identities[identity.name]) {
                keyRing.close(identity.name);
            }
               // identity reloaded
        }
    };


    /**
     * Load a backup, with no arguments loads all available backups.
     */
    $scope.loadBackup = function(identity) {
        if ($scope.toLoad.length > 1 && identity) {
            // Load one identity
            $scope.step='loaded';
            loadBackup(unlockedData[identity.name]);
            notify.success(_('Identity loaded {0}', identity.name));
        } else {
            // Load all identities
            $scope.toLoad.forEach(function(identity) {
                loadBackup(unlockedData[identity.name]);
            });
            notify.success(_('Identities loaded'));
            unlockedData = {};
            // finish the modal
            $scope.ok();
        }
    };


    /**
     * Unlock a backup once having the password
     */
    $scope.unlockBackup = function() {
        var data;
        // Stage 1: decrypt
        try {
            data = sjcl.decrypt($scope.password, backupFile);
        } catch(e) {
            $scope.error = _('Bad password: ') + _(e.message);
            return;
        }
        // Stage 2: Parse json
        try {
            data = JSON.parse(data);
        } catch(e) {
            $scope.error = _('Bad file');
            return;
        }
        $scope.step = 'select';
        $scope.toLoad = [];
        unlockedData = {};

        // Stage 3: Parse some  information from each identity
        Object.keys(data).forEach(function(key) {
            if (key.substr(0,12) == 'dw:identity:') {
                var identity = data[key];
                var commsKey = Bitcoin.ECKey.fromBytes(identity.commsKey, true);
                var pubKey = commsKey.pub.toBytes(true);
                var hash = Bitcoin.convert.bytesToHex(pubKey);
                var nPubKeys = Object.keys(identity.pubkeys).length;
                var nContacts = identity.contacts.length;
                unlockedData[identity.name] = identity;
                
                $scope.toLoad.push({
                    name: key.substr(12),
                    hash: hash,
                    pubKeys: nPubKeys,
                    contacts: nContacts,
                    version: identity.version
                });
            }
        });

        // Stage 4: Check if we actually loaded anything
        if (!$scope.toLoad.length) {
             $scope.error = _('No identities found');
        }
    };


    /**
     * Call to start the import process
     */
    $scope.restoreBackup = function() {
        modals.open('import', {}, function(data) {
        });
    };


    /**
     * Call to start the import process
     * Link with the import file div
     */
    var fileId = $window.document.getElementById('import-wallet-file');
    if (fileId) {
        $window.document.getElementById('import-wallet-file').addEventListener('change', handleFileSelect, false);
    }
  }]);
});
