define(['./module', 'darkwallet', 'util/transport', 'util/channels/catchan', 'util/services'],
function (controllers, DarkWallet, Transport, BtcChannel, Services) {
  'use strict';


  // enc.test();
  // --

  controllers.controller('LobbyCtrl', ['$scope', 'toaster', function($scope, toaster) {

  var transport, identity;
  Services.connectNg('lobby', $scope, null, function(data) {
    identity = DarkWallet.getIdentity();
    transport = DarkWallet.getLobbyTransport();

    $scope.pairCode = '';
    $scope.subscribed = false;
    $scope.shoutbox = '';
    $scope.shoutboxLog = [];
    $scope.shoutboxLogAll = {};

    // Initialize some own data
    $scope.comms = transport.comms;
    $scope.myself = transport.myself;
    $scope.peers = transport.peers;
    $scope.peerIds = transport.peerIds;
    $scope.requests = transport.requests;

    var channel;
    // Action to start announcements and reception
    $scope.announceSelf = function() {
        var pairCodeHash = transport.hashChannelName($scope.pairCode);

        // chan tests
        if ($scope.subscribed != pairCodeHash) {
            channel = transport.initChannel($scope.pairCode, BtcChannel);
            channel.addCallback('subscribed', function() {toaster.pop('success', 'channel', 'subscribed successfully')})
            channel.addCallback('shout', function(data) {
                $scope.shoutboxLog.push(data)
                if (data.sender == channel.fingerprint) {
                    toaster.pop('success', 'me', data.text)
                } else {
                    toaster.pop('note', data.sender.slice(0,12), data.text)
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            })
            $scope.subscribed = pairCodeHash;
        }
        /*
        client.chan_get("b", "announcements", function(err, data){console.log("channel get", err, data)})
        client.chan_list("b", function(err, data){console.log("channel list", err, data)})*/
    }
    $scope.selectPeer = function(peer) {
        $scope.selectedPeer = peer;
        if (!$scope.shoutboxLogAll.hasOwnProperty(peer.name)) {
            $scope.shoutboxLogAll[name] = [];
        }
        $scope.shoutboxLog = $scope.shoutboxLogAll[name];
    }
    $scope.sendText = function() {
        var toSend = $scope.shoutbox;
        $scope.shoutbox = '';
        channel.postEncrypted(JSON.stringify({text: toSend, type: 'shout', sender: channel.fingerprint}), function(err, data) {
          if (err) {
              toaster.pop('error', "error sending " + err)
          }
        });
    }
    if(!$scope.$$phase) {
        $scope.$apply();
    }
  });
}]);
});
