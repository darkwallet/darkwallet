define(['./module', 'darkwallet', 'frontend/services', 'frontend/channel_link', 'bitcoinjs-lib', 'util/protocol'],
function (controllers, DarkWallet, Services, ChannelLink, Bitcoin, Protocol) {
  'use strict';

  controllers.controller('LobbyCtrl', ['$scope', 'toaster', function($scope, toaster) {

  var transport, currentChannel;

  // Link a channel with this scope by name
  var channelLinks = {};
  var linkChannel = function(name) {
      var channelLink;
      if (channelLinks.hasOwnProperty(name)) {
          // Channel is already linked
          channelLink = channelLinks[name];
      } else {
          // Totally new channel, subscribe
          channelLink = new ChannelLink(name, $scope);
          channelLinks[name] = channelLink;
          channelLink.addCallback('subscribed', function() {
              toaster.pop('success', 'channel', 'subscribed successfully')
          })
          channelLink.addCallback('Contact', function(data) {
              toaster.pop('success', 'contact', JSON.stringify(data))
          })
          channelLink.addCallback('Shout', function(data) {
              $scope.shoutboxLog.push(data)
              if (data.sender == channelLink.channel.fingerprint) {
                  toaster.pop('success', 'me', data.body.text)
              } else {
                  toaster.pop('note', data.sender.slice(0,12), data.text)
              }
              if (!$scope.$$phase) {
                  $scope.$apply();
              }
          })
      }
      $scope.subscribed = channelLink.channel.channelHash;
      currentChannel = channelLink.channel;
      return channelLink;
  }

  // Lobby service port
  Services.connectNg('lobby', $scope, function(data) {
    // onMesssage callback
    console.log("[LobbyCtrl] Message", data);
    if (data.type == 'initChannel') {
        linkChannel(data.name);
    }
  }, function(port) {
    // onCreate callback
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

    // Action to start announcements and reception
    $scope.announceSelf = function() {
        var pairCodeHash = transport.hashChannelName($scope.pairCode);

        if ($scope.subscribed != pairCodeHash) {
            if (transport.getChannel($scope.pairCode)) {
                // Channel exists, relink
                linkChannel($scope.pairCode);
            } else {
                // Create if it doesn't exist
                ChannelLink.start($scope.pairCode, port)
            }
            $scope.subscribed = pairCodeHash;
        } else {
            currentChannel.sendOpening();
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
    $scope.pairPeer = function(peer) {
        $scope.selectedPeer = peer;
        var identity = DarkWallet.getIdentity();
        var wallet = identity.wallet;
        var address = wallet.getAddress([wallet.pockets.length-1]);
        var mpk = address.mpk;
        var msg = Protocol.ContactMsg(identity);
        currentChannel.postDH(peer.pubKey, msg, function() {
            toaster.pop("success", "lobby", "pairing sent");
        });
    }
    $scope.sendText = function() {
        var toSend = $scope.shoutbox;
        $scope.shoutbox = '';
        currentChannel.postEncrypted(Protocol.ShoutMsg(toSend), function(err, data) {
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
