define(['bitcoinjs-lib', 'util/multiParty', 'util/djbec', 'sjcl'],
function (Bitcoin, multiParty, Curve25519) {
  'use strict';

  var CryptoJS = Bitcoin.Crypto;
  var SHA256 = Bitcoin.Crypto.SHA256;
  var convert = Bitcoin.convert;
  var BigInteger = Bitcoin.BigInteger;

  // Generate a pair of keys for the whole session
  // Utility function to generate fingerprints like cryptocat
  var genFingerprint = function(key) {
	return CryptoJS.SHA512(
		convert.bytesToWordArray(
			Curve25519.bi2bytes(key, 32)
		)
	)
		.toString()
		.substring(0, 40)
		.toUpperCase()
  }


  /************************************
   * Channel
   */
  function Channel(transport, name) {
      var self = this;
      var client = transport.getClient();
      this.callbacks = {};

      // Set transport session key
      var priv = transport.getSessionKey().priv;
      multiParty.setPrivateKey(priv);
      var pub = multiParty.genPublicKey();

      this.priv = priv;
      this.pub = pub;
      this.transport = transport;
      this.name = name;

      // Set some identity variables
      this.fingerprint = multiParty.genFingerprint();
      multiParty.setNickName = this.fingerprint;

      var newMe = transport.initializePeer(pub.toByteArrayUnsigned());
      this.transport.comms.pubKeyHex = newMe.pubKeyHex;
      this.transport.comms.name = newMe.name;

      // hash channel name
      var channelHash = transport.hashChannelName(name);
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
                    self.triggerCallbacks('subscribed', {})
                }
                console.log("[catchan] channel subscribed", err)
            }, this._onChannelData);
        }
      }
  }

  /*
   * Disconnect the channel
   * Will be unusable afterwards and *must* be discarded.
   */
  Channel.prototype.disconnect = function() {
      this.removeAllCallbacks();
      this.channelUnsubscribe(function(){});
  }

  /*
   * Get peer from the fingerprint
   */
  Channel.prototype.getPeer = function(fingerprint) {
      for(var idx=0; idx<this.transport.peers.length; idx++) {
          var peer = this.transport.peers[idx];
          if (peer.fingerprint == fingerprint) {
              return peer;
          }
      }
  }

  // Send opening messages when joining a channel
  Channel.prototype.sendOpening = function() {
      // Send announcement
      var data = JSON.parse(multiParty.sendPublicKey('all'));
      data.sender = this.fingerprint;
 
      // Send encrypted
      this.postEncrypted(data, function(err, data){
          //console.log("announcement posted", err, data)
      });
  }

  // Subscribe to the channel
  Channel.prototype.channelSubscribe = function(callback, update_cb) {
      var client = this.transport.getClient();
      client.chan_subscribe("b", this.channelHash, callback, update_cb);
  }

  // Unsubscribe from the channel
  Channel.prototype.channelUnsubscribe = function(callback, update_cb) {
      var client = this.transport.getClient();
      client.chan_unsubscribe("b", this.channelHash, callback, update_cb);
  }

  // Post to given channel
  Channel.prototype.post = function(data, callback) {
      var client = this.transport.getClient();
      data.sender = this.fingerprint;
      client.chan_post("b", this.channelHash, data, callback);
  }

  Channel.prototype.receiveDH = function(data) {
      // should be changed by version using multiParty functions
      var otherKey = data.pubKey;
      var pk2 = Bitcoin.BigInteger.fromByteArrayUnsigned(otherKey)
      var shared = Curve25519.ecDH(this.priv, pk2);

      shared = shared.toByteArrayUnsigned()
      shared = Curve25519.bytes2string(shared)

      // First decrypt with given dh secret
      var decrypted;
      try {
          decrypted = sjcl.decrypt(shared, data.data);
      } catch(err) {
          // message is not for us.. ignore     
          console.log("[catchan] Encrypted message not for us!")
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
      }
      // Notify listeners
      this.triggerCallbacks(decoded.type, decoded);
  }

  Channel.prototype.postDH = function(otherKey, data, callback) {
      // should be changed by version using multiParty functions
      data.sender = this.fingerprint;
      var pk2 = Bitcoin.BigInteger.fromByteArrayUnsigned(otherKey)
      var shared = Curve25519.ecDH(this.priv, pk2);
      var myPub = this.pub.toByteArrayUnsigned();
      data.pubKey = myPub;

      shared = shared.toByteArrayUnsigned();
      shared = Curve25519.bytes2string(shared)
      var encrypted = sjcl.encrypt(shared, JSON.stringify(data), {ks: 256, ts: 128});
      this.postEncrypted({'type': 'personal', 'data': encrypted, 'pubKey': myPub}, callback);
  }

  Channel.prototype.postEncrypted = function(data, callback) {
      data.sender = this.fingerprint;
      var encrypted = sjcl.encrypt(this.name, JSON.stringify(data), {ks: 256, ts: 128});
      this.post(encrypted, callback);
  }

  // Callback for data received on channel
  Channel.prototype.addCallback = function(type, callback) {
      if (!this.callbacks.hasOwnProperty(type)) {
          this.callbacks[type] = [callback]
      } else {
          this.callbacks[type].push(callback)
      }
      return callback;
  }
  Channel.prototype.triggerCallbacks = function(type, data) {
      if (this.callbacks.hasOwnProperty(type)) {
          this.callbacks[type].forEach(function(cb) {cb(data)})
      }
  }
  Channel.prototype.removeCallback = function(type, callback) {
      if (this.callbacks.hasOwnProperty(type)) {
          var cbArr = this.callbacks[type];
          if (cbArr.indexOf(callback) != -1) {
              cbArr.splice(cbArr.indexOf(callback), 1);
          }
      }
  }
  Channel.prototype.removeAllCallbacks = function() {
      this.callbacks = {};
  }

  Channel.prototype.onChannelData = function(message) {
      var transport = this.transport;
      var sessionKey = transport.getSessionKey();

      var decrypted, rawDecrypted;
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

          // cryptocat protocol layer
          var first;
          if (decoded.type == 'publicKey') {
              first = Object.keys(decoded.text)[0];
              var pubKeyB64 = decoded.text[first]['message'];
              var pubKey = convert.base64ToBytes(pubKeyB64);
              var pubKeyBi = BigInteger.fromByteArrayUnsigned(pubKey);
              var newPeer = transport.addPeer(pubKey, pubKey);
              newPeer.fingerprint = genFingerprint(pubKeyBi)
              this.startPairing(newPeer.fingerprint, pubKey)
              // set key owner to 'myName' so cryptocat will import the key
              if (first == 'all') {
                multiParty.receiveMessage(decoded.sender, first, decrypted);
              } else {
                // normal cryptocat protocol
                multiParty.receiveMessage(decoded.sender, this.fingerprint, decrypted);
                
              }
          }
          else if (decoded.type == 'Shout') {
              //console.log(decoded.text)
          } else if (decoded.type == 'personal') {
              console.log("[catchan] Decoding DH message");
              this.receiveDH(decoded);
          } else {
              // Not forwarding to cryptocat layer for 'normal' messages
              // multiParty.receiveMessage(decoded.sender, this.fingerprint, rawDecrypted);
          }
          this.triggerCallbacks(decoded.type, decoded);
      }
      transport.update();
  }

  Channel.prototype.startPairing = function(fingerprint, pubKey) {
    console.log('[catchan] startpairing', fingerprint, pubKey)
  }

  return Channel;
});
