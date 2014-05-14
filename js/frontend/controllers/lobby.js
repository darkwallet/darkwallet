'use strict';

define(['./module', 'darkwallet', 'frontend/port', 'frontend/channel_link', 'bitcoinjs-lib', 'util/protocol', 'backend/channels/utils'],
function (controllers, DarkWallet, Port, ChannelLink, Bitcoin, Protocol, ChannelUtils) {

  var bufToArray = function(obj) {return Array.prototype.slice.call(obj, 0)};

  var selectedChannel;

  controllers.controller('LobbyCtrl', ['$scope', 'notify', function($scope, notify) {

  var transport, currentChannel;

  /**
   * Peer Requests
   */
  $scope.peerRequests = [];
  $scope.selectedRequest = false;

  // Open a request from the request list
  $scope.openRequest = function(request) {
      $scope.selectedRequest = request;
  }

  // Cancel a request when already opened
  $scope.cancelRequest = function() {
      var reqIndex = $scope.peerRequests.indexOf($scope.selectedRequest);
      if (reqIndex > -1) {
          $scope.peerRequests.splice(reqIndex, 1);
      }
      $scope.selectedRequest = false;
  }

  $scope.sendPairing = function(peer) {
      var identity = DarkWallet.getIdentity();
      var address = identity.wallet.getAddress([0]);
      currentChannel.sendPairing(identity.name, peer, address.stealth, function() {
          notify.success("lobby", "pairing sent");
      });
  };

  // Accept a request when already opened
  $scope.acceptRequest = function() {
      var identity = DarkWallet.getIdentity();
      var request = $scope.selectedRequest;

      var newContact = {name: request.body.nick, address: request.body.address};

      identity.contacts.addContact(newContact);
      identity.contacts.addContactKey(newContact, request.body.pub);

      $scope.selectedRequest.peer.nick = request.body.nick;

      // For now just cancel
      $scope.cancelRequest();
  }

  $scope.acceptBeacon = function() {
      // Should send a beacon back
      $scope.cancelRequest();
  }

  $scope.sendBeacons = function() {
      var identity = DarkWallet.getIdentity();
      var sent = 0;
      identity.contacts.contacts.forEach(function(contact) {
          var idKey = identity.contacts.findIdentityKey(contact);
          if (idKey) {
              var keys = bufToArray(Bitcoin.base58check.decode(idKey.data.substr(3)).payload);
              var beaconKey = keys.slice(0, 32);
              currentChannel.sendBeacon(beaconKey, function() {});
              sent += 1;
          }
      });
      notify.note("Sent " + sent + " beacons");
  }

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
              notify.success('channel', 'subscribed successfully');
              channelLink.channel.sendOpening();
              if(!$scope.$$phase) {
                  $scope.$apply();
              }
          });
          channelLink.addCallback('Contact', function(data) {
              notify.success('contact', data.body.name);
              var peer = data.peer;
              $scope.newContact = data.body;
              $scope.newContact.pubKeyHex = peer.pubKeyHex;
              $scope.newContact.fingerprint = peer.fingerprint;
          });
          channelLink.addCallback('Shout', function(data) {
              var channel = channelLink.channel;

              // add user pubKeyHex to use as identicon
              if (!data.peer) {
                  // lets set a dummy hex code for now
                  console.log("[Lobby] no peer!!!")
                  data.peer = {pubKeyHex: "deadbeefdeadbeefdeadbeef"};
              }

              // show notification
              if (data.sender != channel.fingerprint) {
                  notify.note(data.peer.name, data.body.text);
              }
              if (!$scope.$$phase) {
                  $scope.$apply();
              }
          });
      }
      $scope.shoutboxLog = channelLink.channel.chatLog;
      $scope.peerRequests = channelLink.channel.peerRequests;

      selectedChannel = name;
      $scope.subscribed = channelLink.channel.channelHash;
      currentChannel = channelLink.channel;

      if (!$scope.$$phase) {
          $scope.$apply();
      }
      return channelLink;
  };

  // Lobby service port
  Port.connectNg('lobby', $scope, function(data) {
    // onMesssage callback
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
        var pairCodeHash = ChannelUtils.hashChannelName(name);

        if (transport.getChannel(name)) {
            // Channel exists, relink
            linkChannel(name);
        } else {
            // Create if it doesn't exist
            ChannelLink.start(name, port);
        }
    };

    var availableChannels = Object.keys(transport.channels);
    if (!selectedChannel && availableChannels.length) {
        // should remember the last connected channel but for
        // now reconnect the last
        var lastChannel = transport.channels[availableChannels[availableChannels.length-1]];
        selectedChannel = lastChannel.name;
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

    if (!$scope.$$phase) {
        $scope.$apply();
    }
    $scope.selectChannel = function(channel) {
        $scope.selectedPeer = false;
        // Relink
        connectChannel(channel.name);
        if (currentChannel) {
            currentChannel.sendOpening();
        }
    };

    $scope.newTempIdentity = function() {
      currentChannel.newSession();
      currentChannel.sendOpening();
    };

    // Action to start announcements and reception
    $scope.joinChannel = function() {
        $scope.selectedPeer = false;
        connectChannel($scope.pairCode);
        $scope.pairCode = '';
    };
    $scope.openPrivate = function(peer) {
        $scope.selectedPeer = peer;
        $scope.shoutboxLog = peer.chatLog;
    };
    $scope.sendContact = function(peer) {
        var identity = DarkWallet.getIdentity();
        var msg = Protocol.ContactMsg(identity);
        currentChannel.postDH(peer.pubKey, msg, function() {
            notify.success("lobby", "pairing sent");
        });
    };
    $scope.sendText = function() {
        var toSend = $scope.shoutbox;
        // don't send empty shouts
        if (toSend == '')
          return;
        $scope.shoutbox = '';

        var onSent = function(err, data) {
          if (err) {
              notify.error("error sending " + err);
          }
        }

        var msg = Protocol.ShoutMsg(toSend);
        if ($scope.selectedPeer) {
            $scope.selectedPeer.channel.postDH($scope.selectedPeer.pubKey, msg, onSent);
            msg.peer = currentChannel.transport.comms;
            $scope.selectedPeer.chatLog.splice(0,0,msg);
        } else {
            currentChannel.postEncrypted(msg, onSent);
        }
    };
    $scope.addNewContact = function(contact) {
        var identity = DarkWallet.getIdentity();
        var newContact = {name: contact.name, address: contact.stealth, fingerprint: contact.fingerprint};
        identity.contacts.addContact(newContact);
        $scope.newContact = null;
        notify.success('Contact added');
    };
  });
}]);
});
