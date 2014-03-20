define(['./module', 'bitcoinjs-lib'], function (controllers, Bitcoin) {
  'use strict';
  controllers.controller('MultisigCtrl', ['$scope', function($scope) {
    $scope.multisig = {};
    $scope.multisig.participants = [];
  }]);
});