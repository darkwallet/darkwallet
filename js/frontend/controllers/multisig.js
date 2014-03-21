define(['./module', 'darkwallet', 'util/btc'],
function (controllers, DarkWallet, BtcUtils) {
  'use strict';
  controllers.controller('MultisigCtrl', ['$scope', function($scope) {
    $scope.multisig = {};
    $scope.multisig.participants = [];
    $scope.nSignatures = 2;
    $scope.multiSigName = '';
	
    $scope.addParticipant = function(data, vars) {
        vars = vars || $scope.multisig;
        vars.participants.push({address: data});
    };

    $scope.createMultisig = function() {
        var participants = [];
        $scope.multisig.participants.forEach(function(participant) {
            console.log(participant.address.length)
            participants.push(BtcUtils.decodeAddress(participant.address));
        });
        var multisig = BtcUtils.multiSig($scope.nSignatures, participants);
        multisig.name = $scope.multiSigName;
        multisig.participants = $scope.multisig.participants.slice(0);

        // Show fund address
        $scope.multiSigAddress = multisig.address;
        if (multisig.name) {
            var identity = DarkWallet.getIdentity();
            identity.wallet.multisig.addFund(multisig);
            $scope.selectFund(multisig, identity.wallet.multisig.funds.length-1);
        }
    };
  }]);
});
