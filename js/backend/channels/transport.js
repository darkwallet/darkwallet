define(['bitcoinjs-lib', 'mnemonicjs', 'backend/services'],
function (Bitcoin, Mnemonic, Services) {
  'use strict';

  var CryptoJS = Bitcoin.Crypto;
  var SHA256 = Bitcoin.Crypto.SHA256;

  /************************************
   * Transport
   */
  function Transport(identity, obeliskClient) {
    this.client = obeliskClient;
    this.channels = {};

    this.requests = [];
    this.peers = [];
    this.peerIds = [];
    this.subscribed = false;

    // Session key
    if (!identity.sessionKey) {
        identity.sessionKey = new Bitcoin.Key();
        identity.sessionKey.compressed = true;
    }
    var sessionKey = identity.sessionKey;

    // Identity (communications) key
    var selfKey;
    if (identity.store.get('commsKey')) {
        selfKey = new Bitcoin.Key(identity.store.get('commsKey'));
    }
    else {
        selfKey = new Bitcoin.Key();
        selfKey.compressed = true;
        identity.store.set('commsKey', selfKey.export('bytes'));
        identity.store.save();
    }
    this.getSelfKey = function() { return selfKey; }
    this.getSessionKey = function() { return sessionKey; }

    // Initialize some own data
    this.comms = this.initializePeer(sessionKey.getPub().toBytes(true));
    this.myself = this.initializePeer(selfKey.getPub().toBytes(true));
  }

  Transport.prototype.getClient = function() {
    return this.client.getClient();
  }

  Transport.prototype.update = function() {
      /*if(!$scope.$$phase) {
          $scope.$apply();
      }*/
  }

  Transport.prototype.hashChannelName = function(channel) {
      var channelHash = SHA256(SHA256(SHA256('Lobby channel: ' + channel)));
      channelHash = Bitcoin.convert.wordArrayToBytes(channelHash);
      return Bitcoin.convert.bytesToHex(channelHash);
  }

  // Get a simple mnemonic name
  Transport.prototype.getMnemoname = function(dataBytes) {
      var mnemonic = new Mnemonic(64);
      mnemonic.random = [];
      mnemonic.random[0] = Bitcoin.convert.bytesToNum(dataBytes.slice(0,4));
      mnemonic.random[1] = Bitcoin.convert.bytesToNum(dataBytes.slice(8,16));
      var mnemoName = mnemonic.toWords().slice(0,4).join(" ");
      return mnemoName;

  }

  // Initialize peer structure
  Transport.prototype.initializePeer = function(pubKeyBytes, fingerprint) {
      var pubKeyHex = Bitcoin.convert.bytesToHex(pubKeyBytes);
      var mnemoname = this.getMnemoname(pubKeyBytes);
      var newPeer = {pubKeyHex: pubKeyHex, name: mnemoname, pubKey: pubKeyBytes, fingerprint: fingerprint};
      return newPeer;

  }

  // Initialize and add peer to scope
  Transport.prototype.addPeer = function(pubKeyBytes, fingerprint) {
      var peer;
      var pubKeyHex = Bitcoin.convert.bytesToHex(pubKeyBytes);
      var peerIndex = this.peerIds.indexOf(pubKeyHex)
      if (peerIndex == -1) {
          peer = this.initializePeer(pubKeyBytes, fingerprint);
          this.peerIds.push(peer.pubKeyHex);
          this.peers.push(peer);
      } else {
          peer = this.peers[this.peerIds.indexOf(pubKeyHex)];
      }
      return peer;
  }

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
  }
  Transport.prototype.closeChannel = function(name) {
      if (!this.channels.hasOwnProperty(name)) {
          throw Error("Channel does not exist");
      }
      console.log("[transport] close channel");
      this.channels[name].disconnect();
      delete this.channels[name];
  }

  Transport.prototype.getChannel = function(name) {
      return this.channels[name];
  }
  return Transport;
});
