'use strict';

define(['bitcoinjs-lib', 'util/djbec', 'util/encryption', 'util/protocol', 'backend/channels/peer', 'backend/channels/utils', 'sjcl'],
function (Bitcoin, Curve25519, Encryption, Protocol, Peer, ChannelUtils) {

  var convert = Bitcoin.convert;
  var BigInteger = Bitcoin.BigInteger;

  /************************************
   * Channel
   */
  function Channel(transport, name) {
      var self = this;
      var client = transport.getClient();
      this.callbacks = {};
      this.chatLog = [];
      this.requested = [];
      this.lastRequest = 0;
      // max messages in the log
      this.maxChatLog = 200;

      // requests coming from peers
      this.peerRequests = [];

      // Set transport session key
      this.transport = transport;
      this.prepareSession();

      this.name = name;

      // hash channel name
      var channelHash = ChannelUtils.hashChannelName(name);
      this.channelHash = channelHash;

      // Subscribe to channel updates
      if (this.subscribed != channelHash) {
        this._onChannelData = function(_data) {self.onChannelData(_data);};
        if (client.handler_map["chan.update." + channelHash]) {
            // update callback
            client.handler_map["chan.update." + channelHash] = this._onChannelData;
        } else {
            this.channelSubscribe(function(err, data){
                if (!err) {
                    self.subscribed = channelHash;
                    // Internal log only for shout messages for now
                    self.addCallback('Shout', function(_data) {self.onChatMessage(_data)})
                    self.addCallback('Pair', function(_data) {self.onPairMessage(_data)})
                    self.addCallback('publicKeyRequest', function(_data) {self.onPublicKeyRequest(_data)})

                    // now tell listeners we'resubscribed
                    self.triggerCallbacks('subscribed', {})
                }
                console.log("[catchan] channel subscribed", name)
            }, this._onChannelData);
        }
      }
  }

  /**
   * Get the session from the transport
   */
  Channel.prototype.prepareSession = function() {
    // Set keys
    var priv = this.transport.getSessionKey().priv;
    var ecPriv = Encryption.adaptPrivateKey(priv);

    this.pub = Curve25519.ecDH(ecPriv);
    this.priv = ecPriv;

    // Setup peer details
    var newMe = new Peer(this.pub.toByteArrayUnsigned());

    // Just relink so interface can be updated
    this.transport.comms.pubKeyHex = newMe.pubKeyHex;
    this.transport.comms.fingerprint = newMe.fingerprint;
    this.transport.comms.name = newMe.name;
    this.transport.comms.pubKey = newMe.pubKey;

    // Set some identity variables
    this.fingerprint = newMe.fingerprint;
  };

  /**
   * Initialize a new session with a new cloak
   */
  Channel.prototype.newSession = function() {
    // For now this will get changed in transport
    // and propagated back to all channels
    this.transport.newSession();
  };

  /**
   * Disconnect the channel
   * Will be unusable afterwards and *must* be discarded.
   */
  Channel.prototype.disconnect = function() {
      this.removeAllCallbacks();
      this.channelUnsubscribe(function(){});
      this.requested = [];
      this.lastRequest = 0;
  };

  /*
   * Get peer from the fingerprint
   */
  Channel.prototype.getPeer = function(fingerprint, discover) {
      if (fingerprint == this.fingerprint) {
          return this.transport.comms;
      }
      for(var idx=0; idx<this.transport.peers.length; idx++) {
          var peer = this.transport.peers[idx];
          if (peer.fingerprint == fingerprint) {
              return peer;
          }
      }
      if (fingerprint.length != 40) {
          // bad peers
          var pubKeyBytes = convert.stringToBytes(fingerprint);
          while(pubKeyBytes.length<32) { pubKeyBytes.push(6) };
          pubKeyBytes = pubKeyBytes.slice(32);

          console.log("[catchan] bad peer detected, dropping lookup", fingerprint);

          var newPeer = this.transport.addPeer(pubKeyBytes, fingerprint);
          newPeer.name = 'troll: ' + newPeer.name;
          newPeer.troll = true;
          return newPeer;
      }
      // unknown, request public key
      if (discover) {
          console.log("[catchan] request pubKey", fingerprint);
          this.requestPublicKey(fingerprint);
      }
      // create a dummy entry in the peers table, we can update it later
      return this.transport.addPeer(null, fingerprint);
  };

  /**
   * Request the public key from the given fingerprint
   */
  Channel.prototype.requestPublicKey = function(fingerprint) {
      if (fingerprint == this.fingerprint) {
          throw Error("Requesting my own public key");
      }
      if (this.requested.indexOf(fingerprint) > -1) {
          console.log("[catchan] dropping request since already requested");
          return;
      }
      this.requested.push(fingerprint);
      // Prepare request
      var data = Protocol.PublicKeyRequestMsg(fingerprint);
 
      // Send encrypted
      this.postEncrypted(data, function(err, data){
          //console.log("announcement posted", err, data)
      }, true);
  };

  /**
   * Callback for a public key request
   */
  Channel.prototype.onPublicKeyRequest = function(data) {
      var now = Date.now();
      if (data.text[this.fingerprint] && (now - this.lastRequest) > 100) {
          console.log("[catchan] answering to pubKey request", this.fingerprint);
          this.sendOpening();
          this.lastRequest = now;
      }
  };

  /**
   * Callback for a public key being received
   */
  Channel.prototype.onPublicKey = function(data) {
      var first = Object.keys(data.text)[0];

      var pubKeyB64 = data.text[first]['message'];
      var pubKey = convert.base64ToBytes(pubKeyB64);

      var fingerprint = Encryption.genFingerprint(pubKey);
      this.transport.addPeer(pubKey, fingerprint);
      this.startPairing(fingerprint, pubKey);
  };


  // Send opening messages when joining a channel
  Channel.prototype.sendOpening = function() {
      // Send announcement
      var data = Protocol.PublicKeyMsg(this.fingerprint, this.pub);
 
      // Send encrypted
      this.postEncrypted(data, function(err, data){
          //console.log("announcement posted", err, data)
      });
  };

  // Subscribe to the channel
  Channel.prototype.channelSubscribe = function(callback, update_cb) {
      var client = this.transport.getClient();
      client.chan_subscribe("b", this.channelHash, callback, update_cb);
  };

  // Unsubscribe from the channel
  Channel.prototype.channelUnsubscribe = function(callback, update_cb) {
      var client = this.transport.getClient();
      if (client.connected) {
          client.chan_unsubscribe("b", this.channelHash, callback, update_cb);
      }
  };

  // Post to given channel
  Channel.prototype.post = function(data, callback) {
      var client = this.transport.getClient();
      data.sender = this.fingerprint;
      if (client.connected) {
          client.chan_post("b", this.channelHash, data, callback);
      }
  };

  /**
   * Callback for a public key being received
   */
  Channel.prototype.onReceiveDH = function(data) {
      var otherKey = data.pubKey;
      var pk2 = BigInteger.fromByteArrayUnsigned(otherKey);
      var shared = Curve25519.ecDH(this.priv, pk2);

      shared = shared.toByteArrayUnsigned();
      shared = Curve25519.bytes2string(shared);

      // First decrypt with given dh secret for our cloak
      var decrypted;
      try {
          decrypted = sjcl.decrypt(shared, data.data);
      } catch(err) {
          return;
      }
      // Now decode json
      var decoded;
      try {
          decoded = JSON.parse(decrypted);
      } catch (e) {
          console.log("[catchan] Invalid dh json! " + e.message);
          return;
      }
      // Add some metadata
      decoded.metadata = {
         whisper: true,
         pubKey: otherKey 
      };
      // add the peer
      var fingerprint = Encryption.genFingerprint(otherKey);
      this.transport.addPeer(otherKey, fingerprint);

      // Notify listeners
      this.triggerCallbacks(decoded.type, decoded);
      return true;
  };

  /**
   * Post data to a public key
   */
  Channel.prototype.postDH = function(otherKey, data, callback) {
      data.sender = this.fingerprint;
      var pk2 = BigInteger.fromByteArrayUnsigned(otherKey);
      var shared = Curve25519.ecDH(this.priv, pk2);
      var myPub = this.pub.toByteArrayUnsigned();
      data.pubKey = myPub;

      shared = shared.toByteArrayUnsigned();
      shared = Curve25519.bytes2string(shared);

      // sjcl here will do pbkdf2 on the shared, so thats our real shared secret
      var encrypted = sjcl.encrypt(shared, JSON.stringify(data), {ks: 256, ts: 128});
      this.postEncrypted({'type': 'personal', 'data': encrypted, 'pubKey': myPub}, callback);
  };

  /**
   * Post data encrypted for the channel
   */
  Channel.prototype.postEncrypted = function(data, callback, hiding) {
      if (!hiding) {
          data.sender = this.fingerprint;
      }
      var encrypted = sjcl.encrypt(this.name, JSON.stringify(data), {ks: 256, ts: 128});
      this.post(encrypted, callback);
  };

  // Callback for data received on channel
  Channel.prototype.addCallback = function(type, callback) {
      if (!this.callbacks.hasOwnProperty(type)) {
          this.callbacks[type] = [callback];
      } else {
          this.callbacks[type].push(callback);
      }
      return callback;
  };

  /**
   * Trigger all callbacks of the given type
   */
  Channel.prototype.triggerCallbacks = function(type, data) {
      // channel messages don't have sender
      if (data.sender && type != 'publicKey') {
          data.peer = this.getPeer(data.sender, true);
      } else if (!data.sender && ['subscribed', 'publicKeyRequest'].indexOf(type) == -1) {
          console.log("[catchan] message with no sender", type, data)
      }
      if (this.callbacks.hasOwnProperty(type)) {
          this.callbacks[type].forEach(function(cb) {cb(data);});
      }
  };

  /**
   * Remove a callback
   */
  Channel.prototype.removeCallback = function(type, callback) {
      if (this.callbacks.hasOwnProperty(type)) {
          var cbArr = this.callbacks[type];
          if (cbArr.indexOf(callback) != -1) {
              cbArr.splice(cbArr.indexOf(callback), 1);
          }
      }
  };

  /**
   * Remove all callbacks
   */
  Channel.prototype.removeAllCallbacks = function() {
      // tell listeners we're being unsubscribed
      if (this.callbacks['unsubscribed'] && this.callbacks['unsubscribed'].length) {
          this.callbacks['unsubscribed'].forEach(function(callback) {
              callback({});
          });
      }
      // Now delete all callbacks
      this.callbacks = {};
  };

  /**
   * Channel data arriving
   */
  Channel.prototype.onChannelData = function(message) {
      var transport = this.transport;

      var decrypted;
      var decoded = JSON.parse(message.data);

      // An encrypted message coming on the channel
      if (decoded.cipher) {
          // channel layer
          try {
              decrypted = sjcl.decrypt(this.name, message.data);
          } catch (e) {
              console.log("[catchan] Invalid channel message: " + e.message);
              return;
          }
          try {
              decoded = JSON.parse(decrypted);
          } catch (e) {
              console.log("[catchan] Invalid channel json: " + e.message);
              return;
          }

          // protocol layer
          var first;
          if (decoded.type == 'publicKey') {
              this.onPublicKey(decoded);
          }
          else if (decoded.type == 'personal') {
              console.log("[catchan] Decoding DH message");
              if (!this.onReceiveDH(decoded)) {
                  this.onReceiveBeacon(decoded);
              }
              // don't want to trigger normal callbacks here.
              return;
          }
          this.triggerCallbacks(decoded.type, decoded);
      }
  };

  Channel.prototype.onChatMessage = function(data) {
      var chatLog;
      if (data.metadata.whisper) {
          chatLog = data.peer.chatLog;
      } else {
          chatLog = this.chatLog;
      }
      // Insert new
      if (chatLog.length > this.maxChatLog) {
          chatLog.pop();
      }
      chatLog.splice(0,0,data);
  };

  /**
   * Beacons and pairing
   */
  Channel.prototype.sendPairing = function(nick, peer, address, callback) {
      var signKey = this.transport.getSignKey();

      var priv = this.transport.getSelfKey().priv;
      var scanPriv = Encryption.adaptPrivateKey(priv);
      var scanKeyPub = Curve25519.ecDH(scanPriv);

      var msg = Protocol.PairMsg(nick, signKey, scanKeyPub, address);
      this.postDH(peer.pubKey, msg, callback);
  }

  Channel.prototype.onPairMessage = function(data) {
      this.peerRequests.push(data);
  }

  Channel.prototype.sendBeacon = function(beaconKey, callback) {
      var signKey = this.transport.getSignKey();

      var msg = Protocol.BeaconMsg(this.pub, signKey);

      this.postDH(beaconKey, msg, callback);
  }

  Channel.prototype.onReceiveBeacon = function(data) {
      var pk2 = BigInteger.fromByteArrayUnsigned(data.pubKey);
      // Decrypt for our scankey may be a beacon
      try {
          decrypted = this.decryptBeacon(data, pk2);
      } catch (err) {
          // message is not for us.. ignore     
          console.log("[catchan] Encrypted message not for us")
          return;
      }
      // Now decode json
      var decoded;
      try {
          decoded = JSON.parse(decrypted);
      } catch (e) {
          console.log("[catchan] Invalid dh json! " + e.message);
          return;
      }
      return decoded;
  }

  Channel.prototype.decryptBeacon = function(data, pk2) {
      var scanPriv = Encryption.adaptPrivateKey(this.transport.getSelfKey().priv);
      var shared = Curve25519.ecDH(scanPriv, pk2);
      shared = shared.toByteArrayUnsigned();
      shared = Curve25519.bytes2string(shared);
      return sjcl.decrypt(shared, data.data);
  }

  Channel.prototype.startPairing = function(fingerprint, pubKey) {
     console.log('[catchan] stored pubkey', fingerprint);
  };

  return Channel;
});
