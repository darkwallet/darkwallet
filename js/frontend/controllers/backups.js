/**
 * Backups
 */
'use strict';

define(['./module', 'frontend/port', 'darkwallet', 'bitcoinjs-lib', 'sjcl'], function (controllers, Port, DarkWallet, Bitcoin) {
  controllers.controller('BackupsCtrl', ['$scope', '$window', 'notify', function($scope, $window, notify) {

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
        $scope.openModal('ask-password', {text: 'Password for encrypting the backups', password: ''}, function(password) {
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
    }


    /**
     * Load a backup, called once for each identity.
     */
    var loadBackup = function(identity) {
        console.log("Load backup!");
    }


    /**
     * Load a backup, with no arguments loads all available backups.
     */
    $scope.loadBackup = function(identity) {
        notify.success("Not loading yet!!")
        if ($scope.toLoad.length > 1 && identity) {
            // Load one identity
            $scope.step='loaded';
            loadBackup(identity);
        } else {
            // Load all identities
            $scope.toLoad.forEach(function(identity) {
                loadBackup(identity);
            });
            // finish the modal
            $scope.ok();
        }
    }


    /**
     * Unlock a backup once having the password
     */
    $scope.unlockBackup = function() {
        var data;
        // Stage 1: decrypt
        try {
            data = sjcl.decrypt($scope.password, backupFile);
        } catch(e) {
            $scope.error = "Bad password: "+e.message;
            return;
        }
        // Stage 2: Parse json
        try {
            data = JSON.parse(data);
        } catch(e) {
            $scope.error = "Bad file";
            return;
        }
        $scope.step = 'select';
        $scope.toLoad = [];

        // Stage 3: Parse some  information from each identity
        Object.keys(data).forEach(function(key) {
            if (key.substr(0,12) == 'dw:identity:') {
                var identity = data[key];
                var commsKey = new Bitcoin.ECKey(identity.commsKey);
                var pubKey = commsKey.getPub().toBytes(true);
                var hash = Bitcoin.convert.bytesToHex(pubKey);
                var nPubKeys = Object.keys(identity.pubkeys).length;
                var nContacts = identity.contacts.length;
                
                $scope.toLoad.push({name: key.substr(12), hash: hash, pubKeys: nPubKeys, contacts: nContacts, version: identity.version});
            }
        });

        // Stage 4: Check if we actually loaded anything
        if (!$scope.toLoad.length) {
             $scope.error = "No identities found";
        }
    };


    /**
     * Call to start the import process
     */
    $scope.restoreBackup = function() {
        $scope.openModal('import', {}, function(data) {
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
