define(['bitcoinjs-lib', 'mnemonicjs', 'util/multiParty'],
function (Bitcoin, Mnemonic, multiParty) {
  'use strict';

  var CryptoJS = Bitcoin.Crypto;
  var SHA256 = Bitcoin.Crypto.SHA256;

  /************************************
   * Transport
   */
  function Transport(identity, client) {
    this.client = client;
    this.channels = {};
    var comms25519 = multiParty.genPrivateKey();
    console.log("25519", comms25519);

    this.pairCode = '';
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
    this.comms = this.initializePeer(sessionKey.getPub().toBytes(true), 32);
    this.myself = this.initializePeer(selfKey.getPub().toBytes(true), 32);
  }

  Transport.prototype.update = function() {
      /*if(!$scope.$$phase) {
          $scope.$apply();
      }*/
  }

  Transport.prototype.hashChannelName = function(channel) {
      var channelHash = SHA256(SHA256(channel)+channel);
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
  Transport.prototype.initializePeer = function(pubKeyBytes, iconSize) {
      var pubKeyHex = Bitcoin.convert.bytesToHex(pubKeyBytes);
      var mnemoname = this.getMnemoname(pubKeyBytes);
      var newPeer = {pubKeyHex: pubKeyHex, name: mnemoname};
      return newPeer;

  }

  // Initialize and add peer to scope
  Transport.prototype.addPeer = function(pubKeyBytes) {
      var newPeer = this.initializePeer(pubKeyBytes, 24);
      this.peerIds.push(newPeer.pubKeyHex);
      this.peers.push(newPeer);
  }

  // Action to start announcements and reception
  Transport.prototype.initChannel = function(pairCode, chanClass) {
      var channel;
      if (this.channels[pairCode]) {
          channel = this.channels[pairCode];
      } else {
          channel = new chanClass(this, pairCode);
          this.channels[pairCode] = channel;
      }
      channel.sendOpening();
      return channel;
  }

  return Transport;
});
