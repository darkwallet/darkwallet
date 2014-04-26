'use strict';

define(['bitcoinjs-lib', 'backend/channels/peer'],
function (Bitcoin, Peer) {

  var SHA256 = Bitcoin.CryptoJS.SHA256;

  /************************************
   * Transport
   */
  function Transport(identity, obeliskService) {
    this.obelisk = obeliskService;
    this.channels = {};
    this.sessionKey = {};

    this.requests = [];
    this.peers = [];
    this.peerIds = [];
    this.subscribed = false;

    this.newSession();

    // Identity (communications) key
    var selfKey;
    if (identity.store.get('commsKey')) {
        selfKey = new Bitcoin.ECKey(identity.store.get('commsKey'));
    }
    else {
        selfKey = new Bitcoin.ECKey();
        selfKey.compressed = true;
        identity.store.set('commsKey', selfKey.toBytes());
        identity.store.save();
    }
    this.getSelfKey = function() { return selfKey; };
    this.getSessionKey = function() { return this.sessionKey; };

    // Initialize some own data
    this.comms = new Peer(this.sessionKey.getPub().toBytes(true));
    this.myself = new Peer(selfKey.getPub().toBytes(true));
  }

  /*
   * Initialize a new discardable session key
   */
  Transport.prototype.newSession = function() {
    this.sessionKey = new Bitcoin.ECKey();
    this.sessionKey.compressed = true;
  };

  Transport.prototype.getClient = function() {
    return this.obelisk.getClient();
  };

  Transport.prototype.update = function() {
      /*if(!$scope.$$phase) {
          $scope.$apply();
      }*/
  };

  Transport.prototype.hashChannelName = function(channel) {
      var channelHash = SHA256(SHA256(SHA256('Lobby channel: ' + channel)));
      channelHash = Bitcoin.convert.wordArrayToBytes(channelHash);
      return Bitcoin.convert.bytesToHex(channelHash);
  };

  // Initialize and add peer to scope
  Transport.prototype.addPeer = function(pubKey, fingerprint) {
      var peer;
      var index = this.peerIds.indexOf(fingerprint);
      if (index == -1) {
          peer = new Peer(pubKey, fingerprint);
          this.peerIds.push(fingerprint);
          this.peers.push(peer);
      } else if (pubKey) {
          peer = this.peers[index];
          peer.updateKey(pubKey);
      }
      return peer;
  };

  // Action to start announcements and reception
  Transport.prototype.initChannel = function(name, chanClass) {
      var channel;
      console.log("[transport] init channel");
      if (this.channels.hasOwnProperty(name)) {
          channel = this.channels[name];
      } else {
          console.log("[transport] create channel");
          channel = new chanClass(this, name);
          this.channels[name] = channel;
      }
      channel.sendOpening();
      return channel;
  };
  Transport.prototype.closeChannel = function(name) {
      if (!this.channels.hasOwnProperty(name)) {
          throw Error("Channel does not exist");
      }
      console.log("[transport] close channel");
      this.channels[name].disconnect();
      delete this.channels[name];
  };

  Transport.prototype.getChannel = function(name) {
      return this.channels[name];
  };

  /**
   * Disconnect the transport
   */
  Transport.prototype.disconnect = function() {
      var self = this;
      var channelNames = Object.keys(this.channels);
      channelNames.forEach(function(name) {
          self.closeChannel(name);
      });
  };
  return Transport;
});
