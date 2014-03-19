define(['./module', 'darkwallet', 'util/transport', 'util/channels/catchan', 'util/encryption'],
function (controllers, DarkWallet, Transport, BtcChannel) {
  'use strict';


  // enc.test();
  // Convert to UTF8
  // console.log('decrypted', Encryption.test());

  // --

  controllers.controller('LobbyCtrl', ['$scope', 'toaster', function($scope, toaster) {
  DarkWallet.service().ready(function() {
    var identity = DarkWallet.getIdentity();
    var transport = DarkWallet.getLobbyTransport();
    //var transport = new Transport(identity, DarkWallet.getClient());

    $scope.pairCode = '';
    $scope.subscribed = false;
    $scope.shoutbox = '';
    $scope.shoutboxLog = [];
    $scope.shoutboxLogAll = {};

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

    var channel;
    // Action to start announcements and reception
    $scope.announceSelf = function() {
        var pairCodeHash = transport.hashChannelName($scope.pairCode);

        // chan tests
        if ($scope.subscribed != pairCodeHash) {
            channel = transport.initChannel($scope.pairCode, BtcChannel);
            channel.addCallback('shout', function(data) {
                $scope.shoutboxLog.push(data)
                toaster.pop('note', data.sender.slice(0,12), data.text)
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
              console.log("error sending", err)
          }
        });
    }
  });
}]);
});
