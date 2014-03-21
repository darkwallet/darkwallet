define(['./module', 'bitcoinjs-lib'], function (controllers, Bitcoin) {
  'use strict';
  controllers.controller('MultisigCtrl', ['$scope', function($scope) {
    $scope.multisig = {};
    $scope.multisig.participants = [];
	
    $scope.addParticipant = function(data, vars) {
      vars.participants.push({address: data});
    };

    $scope.createMultisig = function() {
      var participants = [];
      $scope.multisig.participants.forEach(function(participant) {
        participants = participant.address;
      });
      var script = Bitcoin.Script.createMultiSigOutputScript($scope.numsig, participants);
    };
  }]);
});
