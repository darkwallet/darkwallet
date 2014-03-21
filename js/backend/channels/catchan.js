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
      var priv = multiParty.setPrivateKey(transport.getSessionKey().priv);
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
        var _onChannelData = function(_data) {self.onChannelData(_data);};
        if (client.handler_map["chan.update." + channelHash]) {
            // update callback
            client.handler_map["chan.update." + channelHash] = _onChannelData;
        } else {
            this.channelSubscribe(function(err, data){
                if (!err) {
                    self.subscribed = channelHash;
                }
                console.log("channel subscribed", err, data)
                self.triggerCallbacks('subscribed', {})
            }, _onChannelData);
        }
      }
  }

  // Send opening messages when joining a channel
  Channel.prototype.sendOpening = function() {
      // Send announcement
      var data = JSON.parse(multiParty.sendPublicKey('all'));
      data.sender = this.fingerprint;
      data = JSON.stringify(data);
 
      // Send encrypted
      this.postEncrypted(data, function(err, data){
          //console.log("announcement posted", err, data)
      });
  }

  // Subscribe to given channel
  Channel.prototype.channelSubscribe = function(callback, update_cb) {
      var client = this.transport.getClient();
      client.chan_subscribe("b", this.channelHash, callback, update_cb);
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
      var pk2 = Curve25519.bytes2bi(otherKey)
      var shared = Curve25519.ecDH(this.priv, pk2);

      shared = Curve25519.bi2bytes(shared, 32);
      shared = Curve25519.bytes2string(shared)
      var decrypted;
      try {
          decrypted = sjcl.decrypt(shared, data.data);
      } catch(err) {
          // message is not for us.. ignore     
      }
      if (decrypted) { 
          var decoded = JSON.parse(decrypted);
          this.triggerCallbacks(decoded.type, decoded);
      }
 
  }
  Channel.prototype.postDH = function(otherKey, data, callback) {
      // should be changed by version using multiParty functions
      data.sender = this.fingerprint;
      var pk2 = Curve25519.bytes2bi(otherKey)
      var shared = Curve25519.ecDH(this.priv, pk2);
      var myPub = Curve25519.bi2bytes(this.pub, 32).reverse();

      shared = Curve25519.bi2bytes(shared, 32);
      shared = Curve25519.bytes2string(shared)
      var encrypted = sjcl.encrypt(shared, JSON.stringify(data), {ks: 256, ts: 128});
      this.postEncrypted(JSON.stringify({'type': 'personal', 'data': encrypted, 'pubKey': myPub}), callback);
  }

  Channel.prototype.postEncrypted = function(data, callback) {
      var encrypted = sjcl.encrypt(this.name, data, {ks: 256, ts: 128});
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
  Channel.prototype.removeCallback = function(type, callback) {
      if (this.callbacks.hasOwnProperty(type)) {
          var cbArr = this.callbacks[type];
          if (cbArr.indexOf(callback) != -1) {
              cbArr.splice(cbArr.indexOf(callback), 1);
          }
      }
  }
  Channel.prototype.triggerCallbacks = function(type, data) {
      if (this.callbacks.hasOwnProperty(type)) {
          this.callbacks[type].forEach(function(cb) {cb(data)})
      }
  }

  Channel.prototype.onChannelData = function(message) {
      var transport = this.transport;
      var sessionKey = transport.getSessionKey();

      var decrypted, rawDecrypted;
      var decoded = JSON.parse(message.data);

      // An encrypted message coming on the channel
      if (decoded.cipher) {
          // channel layer
          rawDecrypted = sjcl.decrypt(this.name, message.data);
          decrypted = JSON.parse(rawDecrypted);

          // cryptocat protocol layer
          var first;
          if (decrypted.type == 'publicKey') {
              first = Object.keys(decrypted.text)[0];
              var pubKeyB64 = decrypted.text[first]['message'];
              var pubKey = convert.base64ToBytes(pubKeyB64);
              var pubKeyBi = BigInteger.fromByteArrayUnsigned(pubKey);
              var newPeer = transport.addPeer(pubKey, pubKey);
              newPeer.fingerprint = genFingerprint(pubKeyBi)
              this.startPairing(newPeer.fingerprint, pubKey)
              // set key owner to 'myName' so cryptocat will import the key
              if (first == 'all') {
                multiParty.receiveMessage(decrypted.sender, first, rawDecrypted);
              } else {
                // normal cryptocat protocol
                multiParty.receiveMessage(decrypted.sender, this.fingerprint, rawDecrypted);
                
              }
          }
          else if (decrypted.type == 'shout') {
              //console.log(decrypted.text)
          } else if (decrypted.type == 'personal') {
              this.receiveDH(decrypted);
          } else {
              multiParty.receiveMessage(decrypted.sender, this.fingerprint, rawDecrypted);
          }
          this.triggerCallbacks(decrypted.type, decrypted);
      }
      transport.update();
  }

  Channel.prototype.startPairing = function(fingerprint, pubKey) {
    console.log('startpairing', fingerprint, pubKey)
  }

  return Channel;
});
