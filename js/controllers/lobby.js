define(['./module', 'darkwallet', 'util/transport', 'util/channels/btcchan'],
function (controllers, DarkWallet, Transport, BtcChannel) {
  'use strict';

  // Convert to UTF8
  // console.log('decrypted', Encryption.test());

  // --

  controllers.controller('LobbyCtrl', ['$scope', function($scope) {
  DarkWallet.service().ready(function() {
    var identity = DarkWallet.getIdentity();
    var transport = new Transport(identity, DarkWallet.getClient());

    $scope.pairCode = '';
    $scope.subscribed = false;

    transport.update = function() {
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }

    // Initialize some own data
    $scope.comms = transport.comms;
    $scope.myself = transport.myself;
    $scope.peers = transport.peers;
    $scope.peerIds = transport.peerIds;
    $scope.requests = transport.requests;

    // Action to start announcements and reception
    $scope.announceSelf = function() {
        var pairCodeHash = transport.hashChannelName($scope.pairCode);

        // chan tests
        if ($scope.subscribed != pairCodeHash) {
            var channel = transport.initChannel($scope.pairCode, BtcChannel);
            $scope.subscribed = pairCodeHash;
        }
        /*
        client.chan_get("b", "announcements", function(err, data){console.log("channel get", err, data)})
        client.chan_list("b", function(err, data){console.log("channel list", err, data)})*/
    }
  });
}]);
});
