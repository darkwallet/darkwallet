define(['./module', 'darkwallet', 'util/btc', 'bitcoinjs-lib'],
function (controllers, DarkWallet, BtcUtils, Bitcoin) {
  'use strict';
  controllers.controller('MultisigCtrl', ['$scope', function($scope) {
    $scope.initMultisigForm = function() {
        $scope.multisig = {
          name: '',
          participants: [],
          m: 1
        };
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
        $scope.multisig.m = multiSig.m;
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
            multisig = BtcUtils.multiSig(parseInt($scope.multisig.m), participants);
        }
        multisig.name = $scope.multisig.name;
        multisig.participants = $scope.multisig.participants.slice(0);

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
