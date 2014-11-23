'use strict';

define(['bitcoinjs-lib', 'backend/channels/peer', 'util/djbec', 'util/encryption', 'backend/channels/catchan'],
function (Bitcoin, Peer, Curve25519, Encryption, Channel) {


  /************************************
   * Transport
   */
  function Transport(identity, obeliskService, cryptoService) {
    this.obelisk = obeliskService;
    this.crypto = cryptoService;
    this.identity = identity;
    this.channels = {};
    this.sessionKey = {};

    this.peers = [];
    this.peerIds = [];
    this.subscribed = false;

    this.newSession();

    // Identity (communications) key
    var selfKey;
    if (identity.store.get('commsKey')) {
        selfKey = Bitcoin.ECKey.fromBytes(identity.store.get('commsKey'));
    }
    else {
        selfKey = Bitcoin.ECKey.makeRandom(true);
        identity.store.set('commsKey', selfKey.toBytes());
        identity.store.save();
    }
    var signKey = Bitcoin.convert.bytesToString(selfKey.toBytes());
    var signPubKey = Curve25519.publickey(signKey);

    // Scanning/Encryption
    this.getSelfKey = function() { return selfKey; };

    // Signing
    this.getSignKey = function() { return {pub: signPubKey, priv: signKey}; };

    // Scanning
    var scanPriv = Encryption.adaptPrivateKey(this.getSelfKey().d);
    var scanKeyPub = Curve25519.ecDH(scanPriv);
    this.getScanKey = function() { return {priv: scanPriv, pub: scanKeyPub}; };

    // Session keys
    this.getSessionKey = function() { return this.sessionKey; };

    // Initialize some own data
    this.comms = new Peer(this.sessionKey.pub.toBytes(true));
    this.myself = new Peer(selfKey.pub.toBytes(true));

    this.initWorker();
  }

  Transport.prototype.isOnline = function(contact) {
    var found;
    this.peers.some(function(peer) {
        if (peer.contact === contact) {
            found = peer;
            return true;
        }
    });
    return found;
  }

  /**
   * Initialize a worker thread for processing transport data
   */
  Transport.prototype.initWorker = function() {
    var self = this;
    this.killWorker();
    this.channelWorker = new Worker('/src/js/backend/workers/channel.js');
    this.channelWorker.onmessage = function(oEvent) {
        if (oEvent.data.channelName) {
            self.onWorkerChannelData(oEvent.data);
        } else {
            console.log("[transport] Invalid message from the worker!");
        }
    };
  };

  /**
   * Data incoming from the worker
   */
  Transport.prototype.onWorkerChannelData = function(data) {
      var channelName = data.channelName;
      if (this.channels.hasOwnProperty(channelName)) {
          var channel = this.channels[channelName];
          channel.onWorkerData(data);
      } else {
          console.log("[transport] Message for unexisting worker!");
      }
  };

  /**
   * Kill the worker thread
   */
  Transport.prototype.killWorker = function() {
    if (this.channelWorker) {
       // kill the previous worker
       this.channelWorker.terminate();
       this.channelWorker = undefined;
    }
  };
 
  /**
   * Initialize a new discardable session key
   */
  Transport.prototype.newSession = function() {
    var self = this;
    this.sessionKey = Bitcoin.ECKey.makeRandom(true);

    Object.keys(this.channels).forEach(function(name) {
        self.channels[name].prepareSession();
    });
  };

  /**
   * Initialize a new discardable session key
   */
  Transport.prototype.getClient = function() {
    return this.obelisk.getClient();
  };

  /**
   * Initialize and add peer, or just return it if it just exists
   */
  Transport.prototype.addPeer = function(pubKey, fingerprint, channel) {
      var peer;
      var index = this.peerIds.indexOf(fingerprint);
      if (index === -1) {
          peer = new Peer(pubKey, fingerprint, channel);
          this.peerIds.push(fingerprint);
          this.peers.push(peer);
      } else if (pubKey) {
          peer = this.peers[index];
          peer.updateKey(pubKey);
          peer.updateChannel(channel);
      }
      return peer;
  };

  /**
   * Initialize a channel or get an existing channel if the name is registered
   */
  Transport.prototype.initChannel = function(name) {
      var channel;
      console.log("[transport] init channel", name);
      if (this.channels.hasOwnProperty(name)) {
          channel = this.channels[name];
      } else {
          console.log("[transport] create channel", name);
          channel = new Channel(this, name);
          this.channels[name] = channel;
      }
      channel.sendOpening();
      return channel;
  };

  /**
   * Close a channel by name
   */
  Transport.prototype.closeChannel = function(name) {
      if (!this.channels.hasOwnProperty(name)) {
          throw new Error('Channel does not exist');
      }
      console.log("[transport] close channel", name);
      this.channels[name].disconnect();
      delete this.channels[name];
  };

  /**
   * Get a channel by name
   */
  Transport.prototype.getChannel = function(name) {
      return this.channels[name];
  };

  /**
   * Disconnect the transport and close all channels
   */
  Transport.prototype.disconnect = function() {
      var self = this;
      var channelNames = Object.keys(this.channels);
      channelNames.forEach(function(name) {
          self.closeChannel(name);
      });
      this.killWorker();
  };
  return Transport;
});
