'use strict';

define(['bitcoinjs-lib', 'util/djbec', 'util/encryption', 'util/protocol', 'backend/channels/peer', 'backend/channels/utils', 'backend/port', 'sjcl'],
function (Bitcoin, Curve25519, Encryption, Protocol, Peer, ChannelUtils, Port) {

  var convert = Bitcoin.convert;
  var bufToArray = function(obj) {return Array.prototype.slice.call(obj, 0);};

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
      //this.prepareSession(transport.getSessionKey());
      this.newSession();

      this.name = name;

      // hash channel name
      var channelHash = ChannelUtils.hashChannelName(name);
      this.channelHash = channelHash;

      // Subscribe to channel updates
      if (this.subscribed !== channelHash) {
        this._onChannelData = function(_data) {self.onChannelData(_data);};
        if (client.handler_map["chan.update." + channelHash]) {
            // update callback
            client.handler_map["chan.update." + channelHash] = this._onChannelData;
        } else {
            this.channelSubscribe(function(err, data){
                if (!err) {
                    self.subscribed = channelHash;
                    // Internal log only for shout messages for now
                    self.addCallback('Shout', function(_data) {self.onChatMessage(_data);});
                    self.addCallback('Pair', function(_data) {self.onPairMessage(_data);});
                    self.addCallback('publicKeyRequest', function(_data) {self.onPublicKeyRequest(_data);});

                    // now tell listeners we'resubscribed
                    self.triggerCallbacks('subscribed', {});
                }
                console.log("[catchan] channel subscribed", name);
            }, this._onChannelData);
        }
      }
  }

  /**
   * Get the session from the transport
   */
  Channel.prototype.prepareSession = function(sessionKey) {
    // Set keys
    var priv = sessionKey.d;
    var ecPriv = Encryption.adaptPrivateKey(priv);

    this.pub = Curve25519.ecDH(ecPriv);
    this.priv = ecPriv;

    // Setup peer details
    var newMe = new Peer(this.pub.toBuffer().toJSON().data);

    this.comms = newMe;

    // Just relink so interface can be updated
    /*this.transport.comms.pubKeyHex = newMe.pubKeyHex;
    this.transport.comms.fingerprint = newMe.fingerprint;
    this.transport.comms.name = newMe.name;
    this.transport.comms.pubKey = newMe.pubKey;*/

    // Set some identity variables
    this.fingerprint = newMe.fingerprint;
  };

  /**
   * Initialize a new session with a new cloak
   */
  Channel.prototype.newSession = function() {
    // For now this will get changed in transport
    // and propagated back to all channels
    var sessionKey = Bitcoin.ECKey.makeRandom(true);
    this.prepareSession(sessionKey);
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
      if (fingerprint === this.fingerprint) {
          return this.comms;
      }
      for(var idx=0; idx<this.transport.peers.length; idx++) {
          var peer = this.transport.peers[idx];
          if (peer.fingerprint === fingerprint) {
              peer.updateChannel(this);
              return peer;
          }
      }
      if (fingerprint.length !== 40) {
          // bad peers
          var pubKeyBytes = convert.stringToBytes(fingerprint);
          while(pubKeyBytes.length<32) { pubKeyBytes.push(6); }
          pubKeyBytes = pubKeyBytes.slice(32);

          console.log("[catchan] bad peer detected, dropping lookup", fingerprint);

          var newPeer = this.transport.addPeer(pubKeyBytes, fingerprint, this);
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
      return this.transport.addPeer(null, fingerprint, this);
  };

  /**
   * Request the public key from the given fingerprint
   */
  Channel.prototype.requestPublicKey = function(fingerprint) {
      if (fingerprint === this.fingerprint) {
          throw new Error("Requesting my own public key");
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

      var pubKeyB64 = data.text[first].message;
      var pubKey = convert.base64ToBytes(pubKeyB64);

      var fingerprint = Encryption.genFingerprint(pubKey);
      if (fingerprint === this.fingerprint) {
          return;
      }
      this.transport.addPeer(pubKey, fingerprint, this);
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
   * Post data to a public key
   */
  Channel.prototype.postDH = function(otherKey, data, callback) {
      data.sender = this.fingerprint;
      // prepare the message
      var msg = {
          type: 'postDH',
          fingerprint: this.fingerprint, 
          channelName: this.name,
          otherKey: otherKey,
          privKey: this.priv.toByteArrayUnsigned(),
          pubKey: this.pub.toBuffer().toJSON().data,
          data: data
      };
      // send
      var self = this;
      this.transport.crypto.post(msg, function(err, encrypted) {
          if (!err) {
              self.post(encrypted, callback);
          }
      });
  };

  /**
   * Post data encrypted for the channel
   */
  Channel.prototype.postEncrypted = function(data, callback, hiding) {
      // prepare the message
      var msg = {
          type: 'postEncrypted',
          fingerprint: this.fingerprint, 
          channelName: this.name,
          hiding: hiding,
          data: data
      };

      // send
      var self = this;
      this.transport.crypto.post(msg, function(err, encrypted) {
          if (!err) {
              self.post(encrypted, callback);
          }
      });

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
      if (data.sender && type !== 'publicKey') {
          data.peer = this.getPeer(data.sender, true);
      } else if (!data.sender && ['subscribed', 'publicKeyRequest'].indexOf(type) === -1) {
          console.log("[catchan] message with no sender", type, data);
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
          if (cbArr.indexOf(callback) !== -1) {
              cbArr.splice(cbArr.indexOf(callback), 1);
          }
      }
  };

  /**
   * Remove all callbacks
   */
  Channel.prototype.removeAllCallbacks = function() {
      // tell listeners we're being unsubscribed
      if (this.callbacks.unsubscribed && this.callbacks.unsubscribed.length) {
          this.callbacks.unsubscribed.forEach(function(callback) {
              callback({});
          });
      }
      // Now delete all callbacks
      this.callbacks = {};
  };

  /**
   * Channel worker data arriving
   */
  Channel.prototype.onWorkerData = function(message) {
      if (message.peer) {
          var pubKey = message.peer.pubKey;
          var fingerprint = message.peer.fingerprint;
          message.data.peer = this.transport.addPeer(pubKey, fingerprint, this);
      }
      switch(message.type) {
          case 'beacon':
              this.onReceiveBeacon(message.data);
              break;
          case 'publicKey':
              this.onPublicKey(message.data);
              // continue to trigger callbacks...
          case 'personal':
          case 'channel':
              this.triggerCallbacks(message.data.type, message.data);
              break;
          default:
              console.log("Unknown message type on channel! " + message.type);
              break;
      }
  };

  /**
   * Channel data arriving
   */
  Channel.prototype.onChannelData = function(message) {
      if (!this.transport.channelWorker) {
          console.log("[catchan] Receiving data on dead transport!");
          return;
      }
      // Prepare the message
      var msg = {
          type: 'channelData',
          channelName: this.name,
          channelPriv: this.priv.toByteArrayUnsigned(),
          scanKey: this.transport.getScanKey(),
          message: message
      };
      // serialize private key
      msg.scanKey.priv = msg.scanKey.priv.toByteArrayUnsigned();

      // Send to worker
      this.transport.channelWorker.postMessage(msg);
  };

  Channel.prototype.onChatMessage = function(data) {
      var chatLog;
      if (data.metadata && data.metadata.whisper) {
          chatLog = data.peer.chatLog;
          chatLog.dirty = true;
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

      var scanKey = this.transport.getScanKey();

      var msg = Protocol.PairMsg(nick, signKey, scanKey.pub, address);
      this.postDH(peer.pubKey, msg, callback);
  };

  Channel.prototype.onPairMessage = function(data) {
      var found = this.peerRequests.some(function(request){return request.body.pub===data.body.pub;});
      if (!found) {
          this.peerRequests.push(data);
      }
  };

  Channel.prototype.checkPairMessage = function(decoded) {
      var idKey = decoded.body.pub;
      var keys = bufToArray(Bitcoin.base58check.decode(idKey.substr(3)).slice(1));
      var data = decoded.body;
      var toCheck = data.address+data.nick+data.pub;

      return Curve25519.checksig(decoded.body.sig, toCheck, keys.slice(32));
  };

  Channel.prototype.sendBeacon = function(beaconKey, callback) {
      var signKey = this.transport.getSignKey();
      var work = {type: 'buildBeacon', pubKey: this.pub.toByteArrayUnsigned(), signKey: signKey};
      var self = this;
      this.transport.crypto.post(work, function(err, beacon) {
          if (!err) {
              self.postDH(beaconKey, beacon, callback);
          }
      });
  };

  /**
   * Trigger callbacks for the peer and peer.contact
   * @private
   */
  Channel.prototype.onContactAvailable = function(peer) {
      Port.post('contacts', {type: 'contact', peer: peer});
  };

  Channel.prototype.acceptBeacon = function(request) {
      var peer = request.peer;
      if ((!peer.sentBeacon || (Date.now()-peer.sentBeacon>10000)) && peer.contact && peer.contact.trust.trust > 1) {
          // send beacon to contact
          var idKey = peer.contact.findIdentityKey();
          if (idKey) {
              var keys = bufToArray(Bitcoin.base58check.decode(idKey.data.substr(3)).slice(1));
              var beaconKey = keys.slice(0, 32);
              this.sendBeacon(beaconKey, function() {});
              peer.sentBeacon = Date.now();
              return true;
          }
      }
  };

  Channel.prototype.acceptRequest = function(request) {
      var identity = this.transport.identity;
      if (this.checkPairMessage(request)) {
          // Add the contact if not already present
          if (!identity.contacts.findByAddress(request.body.address)) {
              if (!identity.contacts.searchKeys({data: request.body.pub})) {
                  var data = {name: request.nick, address: request.body.address};
                  var newContact = identity.contacts.addContact(data);
                  newContact.addKey(request.body.pub);
              }
          }
          request.peer.nick = request.nick;
          return true;
      } else {
          return false;
      }
  };

  Channel.prototype.onReceiveBeacon = function(decoded) {
      var self = this;
      // Find out which contact this is
      var enqueue = false;
      var accepted = false;
      var identity = this.transport.identity;
      identity.contacts.contacts.forEach(function(contact) {
           var idKey = contact.findIdentityKey();
           if (idKey) {
               var keys = bufToArray(Bitcoin.base58check.decode(idKey.data.substr(3)).slice(1));
               var signKey = Bitcoin.convert.bytesToString(keys.slice(32));
               if (signKey === decoded.body.pub) {
                   var toCheck = decoded.body.ephem+decoded.body.pub;
                   if (Curve25519.checksig(decoded.body.sig, toCheck, keys.slice(32))) {
                       decoded.body.nick = contact.data.name;
                       decoded.peer.nick = contact.data.name;
                       decoded.peer.contact = contact;
                       contact.online = decoded.peer;
                       // answer automatically if trust 2 or greater, or already uncloaked
                       if (contact.trust.trust > 1 || (contact.online === decoded.peer)) {
                           // If online and trust is less than 0 we won't send another beacon but also won't queue
                           if (contact.trust.trust >= 0) {
                               self.acceptBeacon(decoded);
                           }
                       } else {
                           self.onContactAvailable(decoded.peer, contact);
                           enqueue = true;
                       }
                   } else {
                       console.log("failed signature check!");   
                   }
               }
           }
      });
      if (enqueue) {
          var found = this.peerRequests.some(function(request){return request.body.pub===decoded.body.pub;});
          if (!found) {
              this.peerRequests.push(decoded);
          }
      }
      this.triggerCallbacks('Beacon', decoded);
      return decoded;
  };

  Channel.prototype.startPairing = function(fingerprint, pubKey) {
     console.log('[catchan] stored pubkey', fingerprint);
  };

  return Channel;
});
