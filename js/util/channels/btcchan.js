define(['util/stealth', 'bitcoinjs-lib'],
function (Stealth, Bitcoin) {
  'use strict';

  var CryptoJS = Bitcoin.Crypto;
  var SHA256 = Bitcoin.Crypto.SHA256;

  /************************************
   * Channel
   */
  function Channel(transport, name) {
      var self = this;
      var client = transport.getClient();
      var channelHash = transport.hashChannelName(name);
      this.transport = transport;
      this.name = name;
      this.channelHash = channelHash;
      // chan tests
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

  Channel.prototype.sendOpening = function() {
      // Send announcement
      var sessionKey = this.transport.getSessionKey();
      var pubKeyHash = sessionKey.getPub().toHex(true);

      // Send encrypted
      this.channelPostEncrypted(pubKeyHash, function(err, data){
          console.log("announcement posted", err, data)
      });
  }

  // Subscribe to given channel
  Channel.prototype.channelSubscribe = function(callback, update_cb) {
      var client = this.transport.getClient();
      client.chan_subscribe("b", this.channelHash, callback, update_cb);
  }

  // Post to given channel
  Channel.prototype.channelPost = function(data, callback) {
      var client = this.transport.getClient();
      client.chan_post("b", this.channelHash, data, callback);
  }

  Channel.prototype.channelPostEncrypted = function(data, callback) {
      var encrypted = sjcl.encrypt(this.channelHash, data, {ks: 256, ts: 128});
      console.log("encrypted", encrypted);
      this.channelPost(encrypted, callback);
  }

  // Callback for data received on channel
  Channel.prototype.onChannelData = function(message) {
      var transport = this.transport;
      var sessionKey = transport.getSessionKey();

      var decrypted;
      var decoded = JSON.parse(message.data);
      // Just an encrypted message
      if (decoded.cipher) {
          decrypted = sjcl.decrypt(this.channelHash, message.data);
          var decryptedBytes = Bitcoin.convert.hexToBytes(decrypted);
          if (decrypted != transport.comms.pubKeyHex) {
              if (transport.peerIds.indexOf(decrypted) == -1) {
                  transport.addPeer(decryptedBytes);
              }
              this.startPairing(decryptedBytes);
          }
      // Stealth message to us (maybe)
      } else if (decoded.pub) {
          console.log("stealth", sessionKey, decoded);
          decrypted = Stealth.decrypt(sessionKey, decoded);
      }
      if (decrypted) {
          transport.requests.push({data: decrypted});
          console.log("data for channel", decrypted);
      }
      console.log("data for channel2", message, message.data);
      transport.update();
  }

  // Start pairing with another identity
  Channel.prototype.startPairing = function(pubKey) {
      // pair to a specific user session public key
      var msg = 'hello';
      var encrypted = Stealth.encrypt(pubKey, msg);
      this.channelPost(JSON.stringify(encrypted), function(err, data){
          console.log("channel post2", err, data)
      });
  }


  return Channel;
});
