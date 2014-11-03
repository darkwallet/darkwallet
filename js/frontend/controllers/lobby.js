'use strict';

define(['./module', 'darkwallet', 'frontend/port', 'frontend/channel_link', 'bitcoinjs-lib', 'util/protocol', 'backend/channels/utils'],
function (controllers, DarkWallet, Port, ChannelLink, Bitcoin, Protocol, ChannelUtils) {

  var bufToArray = function(obj) {return Array.prototype.slice.call(obj, 0)};

  var selectedChannel;

  controllers.controller('LobbyCtrl', ['$scope', 'notify', '$timeout', 'modals', '_Filter', function($scope, notify, $timeout, modals, _) {

  var currentChannel, lobbyPort;
  ChannelLink.links = {};

  /**
   * Peer Requests
   */
  $scope.peerRequests = [];
  $scope.selectedRequest = false;
  $scope.anyPaired = false;
  $scope.canRemove = false;

  // Peer timing
  $scope.fadeTimeout = 240 * 1000;
  $scope.lastTimestamp = Date.now();

  $scope.refreshTimestamp = function(peer) {
      peer.timestamp = Date.now();
  }

  /**
   * Pairing requests
   */
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

  $scope.sendRequest = function(peer) {
      var identity = DarkWallet.getIdentity();
      var address = identity.wallet.getAddress([0]);
      var message = _('Send identity information');
      var detail = _('This will send long term pairing information and identity pubkeys, are you sure?');
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

      var peerChannel = request.peer.channel;
      if (peerChannel.acceptPairMessage(request)) {
          $scope.anyPaired = true;
          notify.success(_('{0} added to contacts', request.nick));
      } else {
          notify.warning(_('Scam attempt'), _('Oops seems the signature was wrong'));
      }

      // For now just cancel
      $scope.cancelRequest();
  }

  /**
   * Beacons
   */
  // Send a beacon for the given contact over given channel
  var sendBeacon = function(channel, contact) {
      var idKey = contact.findIdentityKey();
      if (idKey) {
          var keys = bufToArray(Bitcoin.base58check.decode(idKey.data.substr(3)).slice(1));
          var beaconKey = keys.slice(0, 32);
          channel.sendBeacon(beaconKey, function() {});
          return true;
      }
  };

  // Accept a beacon on the gui
  $scope.acceptBeacon = function() {
      var peer = $scope.selectedRequest.peer;

      // Send a beacon back to the contact
      if (peer.channel && peer.channel.acceptBeacon($scope.selectedRequest)) {
          notify.note(_('Sent a beacon back to the contact'));
      }

      // now clear the request
      $scope.cancelRequest();
  }

  // Send beacons for all contacts
  $scope.sendBeacons = function(minLevel) {
      if (minLevel === undefined) {minLevel = -6};
      var identity = DarkWallet.getIdentity();
      var sent = 0;
      identity.contacts.contacts.forEach(function(contact) {
          if (contact.trust.trust >= minLevel) {
              if (sendBeacon(currentChannel, contact)) {
                  sent += 1;
              }
          }
      });
      if (minLevel < -2) {
          notify.note(_('Sent {0} beacons', sent));
      }
  }

  /**
   * Channel links
   */
  $scope.updateChat = function() {
      $scope.lastTimestamp = Date.now();
      $timeout(function() {
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      });
  }

  var createChannelLink = function(name) {
      var channelLink = ChannelLink.create(name, $scope, notify, _);

      // set controller variables
      selectedChannel = name; 
      currentChannel = channelLink.channel;

      // set scope
      $scope.comms = channelLink.channel.comms;
      $scope.shoutboxLog = channelLink.channel.chatLog;
      $scope.peerRequests = channelLink.channel.peerRequests;

      $scope.canRemove = (['Trollbox', 'Trollnet'].indexOf(name) === -1 && name.indexOf('CoinJoin') !== 0);
      $scope.subscribed = channelLink.channel.channelHash;

      $scope.lastTimestamp = Date.now();

      // Send beacons with level 2 or more
      $scope.sendBeacons(2);
      currentChannel.sendOpening();

      // apply scope
      if (!$scope.$$phase) {
          $scope.$apply();
      }
  };


  /**
   * Lobby initialization
   */
  var onLobbyInitialized = function(port) {
      lobbyPort = port;
      // onCreate callback
      var transport = DarkWallet.getLobbyTransport();

      // if no channel show transport cloak...
      $scope.comms = transport.comms;

      checkPaired(DarkWallet.getIdentity());

      $scope.lobbyChannels = transport.channels;

      $scope.pairCode = '';

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
          $scope.connectChannel(selectedChannel);
      }

  }

  /**
   * Lobby port
   */
  Port.connectNg('lobby', $scope, function(data) {
      // onMesssage callback
      if (data.type == 'initChannel') {
          createChannelLink(data.name);
      }
  }, function(port) {
      onLobbyInitialized(port);
      if (!$scope.$$phase) {
          $scope.$apply();
      }
  });

  /**
   * Peer and identity
   */
  var cleanPeer = function() {
      if ($scope.selectedPeer) {
          $scope.selectedPeer.chatLog.dirty = false;
          $scope.selectedPeer = false;
      }
  }

  $scope.newTempIdentity = function() {
      currentChannel.newSession();
      $scope.comms = currentChannel.comms;
      currentChannel.sendOpening();
  };

  /**
   * Channels
   */
  // Initialize a channel
  $scope.connectChannel = function(name) {
      var transport = DarkWallet.getLobbyTransport();

      if (transport.getChannel(name)) {
          // Channel exists, relink
          createChannelLink(name);
      } else {
          // Create if it doesn't exist
          ChannelLink.start(name, lobbyPort);
      }
  };

  $scope.selectChannel = function(channel) {
      cleanPeer();
      // Relink
      $scope.connectChannel(channel.name);
  };

  // Action to start announcements and reception
  $scope.joinChannel = function() {
      cleanPeer();
      // Relink
      $scope.connectChannel($scope.pairCode);
      $scope.pairCode = '';
  };

  $scope.removeChannel = function() {
      cleanPeer();
      var name = currentChannel.name;
      if (ChannelLink.links.hasOwnProperty(name)) {
          // Channel is linked
          ChannelLink.links[name].disconnect();
          delete ChannelLink.links[name];
          $scope.pairCode = '';
          var transport = DarkWallet.getLobbyTransport();
          transport.closeChannel(name);
          currentChannel = undefined;
          selectedChannel = undefined;
          $scope.subscribed = undefined;
      }
  };

  /**
   * Chat and messaging
   */
  $scope.openPrivate = function(peer) {
      cleanPeer();
      $scope.selectedPeer = peer;
      $scope.selectedPeer.chatLog.dirty = false;
      $scope.shoutboxLog = peer.chatLog;
  };

  var onSent = function(err) {
      if (err) {
          notify.error(_('error sending'), _(err));
      }
  };

  $scope.sendText = function() {
      if ($scope.shoutbox == '') {
          return;
      }
      var msg = Protocol.ShoutMsg($scope.shoutbox);
      var peer = $scope.selectedPeer;
      if (peer) {
          peer.channel.postDH(peer.pubKey, msg, onSent);
          msg.peer = currentChannel.comms;
          peer.chatLog.splice(0,0,msg);
          peer.chatLog.dirty = false;
      } else {
          currentChannel.postEncrypted(msg, onSent);
      }
      $scope.shoutbox = '';
  };

  /**
   * Contact send and receive
   */
  $scope.sendContact = function(peer) {
      var identity = DarkWallet.getIdentity();
      var msg = Protocol.ContactMsg(identity);
      currentChannel.postDH(peer.pubKey, msg, function() {
          notify.success(_('lobby'), _('pairing sent'));
      });
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

}]);
});
