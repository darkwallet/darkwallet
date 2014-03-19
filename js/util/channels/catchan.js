define(['stealth', 'bitcoinjs-lib', 'util/multiParty'],
function (Stealth, Bitcoin, multiParty) {
  'use strict';

  var CryptoJS = Bitcoin.Crypto;
  var SHA256 = Bitcoin.Crypto.SHA256;
  var convert = Bitcoin.convert;

  // Generate a pair of keys for the whole session
  var priv = multiParty.genPrivateKey();
  var pub = multiParty.genPublicKey();

  /************************************
   * Channel
   */
  function Channel(transport, name) {
      var self = this;
      var client = transport.client;
      this.callbacks = {};
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
      var client = this.transport.client;
      client.chan_subscribe("b", this.channelHash, callback, update_cb);
  }

  // Post to given channel
  Channel.prototype.post = function(data, callback) {
      var client = this.transport.client;
      data.sender = this.fingerprint;
      client.chan_post("b", this.channelHash, data, callback);
  }

  Channel.prototype.postEncrypted = function(data, callback) {
      var encrypted = sjcl.encrypt(this.channelHash, data, {ks: 256, ts: 128});
      this.post(encrypted, callback);
  }

  // Callback for data received on channel
  Channel.prototype.addCallback = function(type, callback) {
      if (!this.callbacks.hasOwnProperty(type)) {
          this.callbacks[type] = [callback]
      } else {
          this.callbacks[type].push(callback)
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
          rawDecrypted = sjcl.decrypt(this.channelHash, message.data);
          decrypted = JSON.parse(rawDecrypted);

          // cryptocat protocol layer
          if (decrypted.type == 'publicKey') {
              var first = Object.keys(decrypted.text)[0];
              var pubkey = decrypted.text[first]['message'];
              var newPeer = transport.addPeer(convert.base64ToBytes(pubkey), pubkey);
          }
          if (decrypted.type == 'shout') {
              //console.log(decrypted.text)
          }
          this.triggerCallbacks(decrypted.type, decrypted);

          // avoid running non cryptocat messages through cryptocat
          if (decrypted.type != 'shout') {
            multiParty.receiveMessage(decrypted.sender, this.fingerprint, rawDecrypted);
          }
      }
      transport.update();
  }

  return Channel;
});
