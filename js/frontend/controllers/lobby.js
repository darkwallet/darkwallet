define(['./module', 'darkwallet', 'frontend/services', 'frontend/channel_link', 'bitcoinjs-lib', 'util/protocol'],
function (controllers, DarkWallet, Services, ChannelLink, Bitcoin, Protocol) {
  'use strict';

  var selectedChannel;

  controllers.controller('LobbyCtrl', ['$scope', 'notify', function($scope, notify) {

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
              notify.success('channel', 'subscribed successfully')
              channelLink.channel.sendOpening();
              if(!$scope.$$phase) {
                  $scope.$apply();
              }
          })
          channelLink.addCallback('Contact', function(data) {
              notify.success('contact', data.body.name)
              var peer = data.peer;
              $scope.newContact = data.body;
              $scope.newContact.pubKeyHex = peer.pubKeyHex;
              $scope.newContact.fingerprint = peer.fingerprint;
          })
          channelLink.addCallback('Shout', function(data) {
              var peer = channelLink.channel.getPeer(data.sender)
              var channel = channelLink.channel;

              // add user pubKeyHex to use as identicon
              if (!data.peer) {
                  // lets set a dummy hex code for now
                  data.peer = {pubKeyHex: "deadbeefdeadbeefdeadbeef"};
              }

              // show notification
              if (data.sender == channel.fingerprint) {
                  notify.success('me', data.body.text)
              } else {
                  notify.note(data.sender.slice(0,12), data.text)
              }
              if (!$scope.$$phase) {
                  $scope.$apply();
              }
          })
      }
      $scope.shoutboxLog = channelLink.channel.chatLog;

      selectedChannel = name;
      $scope.subscribed = channelLink.channel.channelHash;
      currentChannel = channelLink.channel;

      if (!$scope.$$phase) {
          $scope.$apply();
      }
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

    $scope.lobbyChannels = transport.channels;

    $scope.pairCode = '';

    // Initialize a channel
    var connectChannel = function(name) {
        var pairCodeHash = transport.hashChannelName(name);

        if (transport.getChannel(name)) {
            // Channel exists, relink
            linkChannel(name);
        } else {
            // Create if it doesn't exist
            ChannelLink.start(name, port);
        }
        $scope.subscribed = pairCodeHash;
    }

    if (!selectedChannel && transport.channels && transport.channels.length) {
        // should remember the last connected channel but for
        // now reconnect the first
        selectedChannel = transport.channels[transport.channels.length-1].name;
    }

    $scope.subscribed = false;
    $scope.shoutbox = '';
    $scope.shoutboxLog = [];

    // Initialize some own data
    $scope.comms = transport.comms;
    $scope.myself = transport.myself;
    $scope.peers = transport.peers;
    $scope.peerIds = transport.peerIds;
    $scope.requests = transport.requests;

    // Now reconnect or initialize
    if (selectedChannel) {
        connectChannel(selectedChannel);
    }

    $scope.selectChannel = function(channel) {
        // Relink
        connectChannel(channel.name);
        if (currentChannel) {
            currentChannel.sendOpening();
        }
    }

    // Action to start announcements and reception
    $scope.joinChannel = function() {
        connectChannel($scope.pairCode);
    }
    $scope.selectPeer = function(peer) {
        $scope.selectedPeer = peer;
    }
    $scope.pairPeer = function(peer) {
        $scope.selectedPeer = peer;
        var identity = DarkWallet.getIdentity();
        var msg = Protocol.ContactMsg(identity);
        currentChannel.postDH(peer.pubKey, msg, function() {
            notify.success("lobby", "pairing sent");
        });
    }
    $scope.sendText = function() {
        var toSend = $scope.shoutbox;
        $scope.shoutbox = '';
        currentChannel.postEncrypted(Protocol.ShoutMsg(toSend), function(err, data) {
          if (err) {
              notify.error("error sending " + err)
          }
        });
    }
    $scope.addNewContact = function(contact) {
        var identity = DarkWallet.getIdentity();
        var newContact = {name: contact.name, address: contact.stealth, fingerprint: contact.fingerprint};
        identity.contacts.addContact(newContact)
        $scope.newContact = null;
        notify.success('Contact added')
    }
  });
}]);
});
