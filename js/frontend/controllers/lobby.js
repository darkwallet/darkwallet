'use strict';

define(['./module', 'darkwallet', 'frontend/port', 'frontend/channel_link', 'bitcoinjs-lib', 'util/protocol', 'backend/channels/utils'],
function (controllers, DarkWallet, Port, ChannelLink, Bitcoin, Protocol, ChannelUtils) {

  var bufToArray = function(obj) {return Array.prototype.slice.call(obj, 0)};

  var selectedChannel;

  controllers.controller('LobbyCtrl', ['$scope', 'notify', '$timeout', 'modals', '_Filter', function($scope, notify, $timeout, modals, _) {

  var transport, currentChannel;

  /**
   * Peer Requests
   */
  $scope.peerRequests = [];
  $scope.selectedRequest = false;
  $scope.anyPaired = false;

  var checkPaired = function(identity) {
      var identity = DarkWallet.getIdentity();
      var anyPaired = false;
      $scope.anyPaired = identity.contacts.contacts.some(function(contact) {
          if (contact.findIdentityKey()) {
              return true;
          }
      });
  }

  // Open a request from the request list
  $scope.openRequest = function(request) {
      $scope.selectedRequest = request;
      if ($scope.selectedRequest.type == 'Pair') {
          // Copy the nick over so we can modify it without affecting the
          // original body (so we can check the signature later).
          $scope.selectedRequest.nick = $scope.selectedRequest.body.nick;
      }
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
      var message = "Send identity information";
      var detail = "This will send long term pairing information and identity pubkeys, are you sure?";
      modals.open('confirm', {message: message, detail: detail}, function() {
          currentChannel.sendPairing(identity.name, peer, address.stealth, function() {
              notify.success(_('lobby'), _('pairing sent'));
          });
      });
  };

  // Accept a request when already opened
  $scope.acceptRequest = function() {
      var identity = DarkWallet.getIdentity();
      var request = $scope.selectedRequest;

      var peerChannel = $scope.selectedRequest.peer.channel;
      if (peerChannel.checkPairMessage(request)) {
          // Add the contact if not already present
          if (!identity.contacts.findByAddress(request.body.address)) {
              if (!identity.contacts.searchKeys({data: request.body.pub})) {
                  var data = {name: request.nick, address: request.body.address};
                  var newContact = identity.contacts.addContact(data);
                  newContact.addKey(request.body.pub);
              }
          }
          $scope.anyPaired = true;
          $scope.selectedRequest.peer.nick = request.nick;
          notify.success(_('{0} added to contacts', request.nick));
      } else {
          notify.warning(_('Scam attempt'), _('Oops seems the signature was wrong'));
      }

      // For now just cancel
      $scope.cancelRequest();
  }

  // Send a beacon for the given contact over given channel
  var sendBeacon = function(channel, contact) {
      var idKey = contact.findIdentityKey();
      if (idKey) {
          var keys = bufToArray(Bitcoin.base58check.decode(idKey.data.substr(3)).payload);
          var beaconKey = keys.slice(0, 32);
          channel.sendBeacon(beaconKey, function() {});
          return true;
      }
  };

  // Accept a beacon on the gui
  $scope.acceptBeacon = function() {
      var peer = $scope.selectedRequest.peer;

      // Send a beacon back to the contact
      if (peer.channel && peer.contact) {
          notify.note(_('Sent a beacon back to the contact'));
          sendBeacon(peer.channel, peer.contact);
      }

      // now clear the request
      $scope.cancelRequest();
  }

  // Send beacons for all contacts
  $scope.sendBeacons = function() {
      var identity = DarkWallet.getIdentity();
      var sent = 0;
      identity.contacts.contacts.forEach(function(contact) {
          if (sendBeacon(currentChannel, contact)) {
              sent += 1;
          }
      });
      notify.note(_('Sent {0} beacons', sent));
  }

  // hide peers after 4 mins
  $scope.fadeTimeout = 240 * 1000;
  $scope.lastTimestamp = Date.now();

  $scope.refreshTimestamp = function(peer) {
      peer.timestamp = Date.now();
  }

  var updateChat = function() {
      $scope.lastTimestamp = Date.now();
      $timeout(function() {
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      });
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
              notify.success(_('channel'), _('subscribed successfully'));
              $scope.lastTimestamp = Date.now();
              channelLink.channel.sendOpening();
              if(!$scope.$$phase) {
                  $scope.$apply();
              }
          });
          channelLink.addCallback('Contact', function(data) {
              notify.success(_('contact'), data.body.name);
              var peer = data.peer;
              $scope.newContact = data.body;
              $scope.newContact.pubKeyHex = peer.pubKeyHex;
              $scope.newContact.fingerprint = peer.fingerprint;
          });
          channelLink.addCallback('Beacon', function(data) {
              updateChat();
          });
          channelLink.addCallback('Pair', function(data) {
              updateChat();
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
              updateChat();
          });
      }
      $scope.comms = channelLink.channel.comms;
      $scope.shoutboxLog = channelLink.channel.chatLog;
      $scope.peerRequests = channelLink.channel.peerRequests;

      selectedChannel = name;
      $scope.subscribed = channelLink.channel.channelHash;
      currentChannel = channelLink.channel;

      $scope.lastTimestamp = Date.now();
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

    // if no channel show transport cloak...
    $scope.comms = transport.comms;

    checkPaired(DarkWallet.getIdentity());

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
    var cleanPeer = function() {
        if ($scope.selectedPeer) {
            $scope.selectedPeer.chatLog.dirty = false;
            $scope.selectedPeer = false;
        }
    }
    $scope.selectChannel = function(channel) {
        cleanPeer();
        // Relink
        connectChannel(channel.name);
        if (currentChannel) {
            currentChannel.sendOpening();
        }
    };

    $scope.newTempIdentity = function() {
      currentChannel.newSession();
      $scope.comms = currentChannel.comms;
      currentChannel.sendOpening();
    };

    // Action to start announcements and reception
    $scope.joinChannel = function() {
        cleanPeer();
        // Relink
        connectChannel($scope.pairCode);
        $scope.pairCode = '';
    };
    $scope.openPrivate = function(peer) {
        cleanPeer();
        $scope.selectedPeer = peer;
        $scope.selectedPeer.chatLog.dirty = false;
        $scope.shoutboxLog = peer.chatLog;
    };
    $scope.sendContact = function(peer) {
        var identity = DarkWallet.getIdentity();
        var msg = Protocol.ContactMsg(identity);
        currentChannel.postDH(peer.pubKey, msg, function() {
            notify.success(_('lobby'), _('pairing sent'));
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
              notify.error(_('error sending'), err);
          }
        }

        var msg = Protocol.ShoutMsg(toSend);
        if ($scope.selectedPeer) {
            $scope.selectedPeer.channel.postDH($scope.selectedPeer.pubKey, msg, onSent);
            msg.peer = currentChannel.comms;
            $scope.selectedPeer.chatLog.splice(0,0,msg);
            $scope.selectedPeer.chatLog.dirty = false;
        } else {
            currentChannel.postEncrypted(msg, onSent);
        }
    };
    $scope.addNewContact = function(contact) {
        var identity = DarkWallet.getIdentity();
        var newContact = {name: contact.name, address: contact.stealth, fingerprint: contact.fingerprint};
        if (!identity.contacts.findByAddress(contact.stealth)) {
            identity.contacts.addContact(newContact);
            notify.success(_('Contact added'));
        } else {
            notify.warning(_('Contact already present'));
        }
        $scope.newContact = null;
    };
  });
}]);
});
