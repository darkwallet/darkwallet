define(['./module', 'darkwallet', 'util/btc', 'bitcoinjs-lib'],
function (controllers, DarkWallet, BtcUtils, Bitcoin) {
  'use strict';
  controllers.controller('MultisigCtrl', ['$scope', function($scope) {
    $scope.initMultisigForm = function() {
        $scope.multisig = {};
        $scope.multisig.participants = [];
        $scope.nSignatures = 2;
        $scope.multiSigName = '';
    }
    $scope.initMultisigForm();
	
    $scope.addParticipant = function(data, vars) {
        vars = vars || $scope.multisig;
        vars.participants.push({address: data});
    };

    $scope.importMultisig = function() {
        var data = $scope.pasteClipboard();
        var multiSig = BtcUtils.importMultiSig(data);
        multiSig.pubKeys.forEach(function(participant) {
            $scope.addParticipant(Bitcoin.convert.bytesToHex(participant))
        });
        $scope.multisig.script = multiSig;
        $scope.nSignatures = multiSig.m;
    };
    $scope.createMultisig = function() {
        var participants = [];
        var multisig;
        if ($scope.multisig.script) {
            // TODO: this won't pick up changes since the script was made, careful
            multisig = $scope.multisig.script;
        } else {
            $scope.multisig.participants.forEach(function(participant) {
                participants.push(BtcUtils.decodeAddress(participant.address));
            });
            multisig = BtcUtils.multiSig($scope.nSignatures, participants);
        }
        multisig.name = $scope.multiSigName;
        multisig.participants = $scope.multisig.participants.slice(0);

        // Show fund address
        $scope.multiSigAddress = multisig.address;
        if (multisig.name) {
            var identity = DarkWallet.getIdentity();
            var walletAddress = identity.wallet.multisig.addFund(multisig);
            $scope.selectFund(multisig, identity.wallet.multisig.funds.length-1);
            DarkWallet.service().initAddress(walletAddress);
            // clean up scope
            $scope.initMultisigForm();
        }
    };
  }]);
});
