define(['stealth', 'bitcoinjs-lib', 'mnemonicjs', 'util/multiParty'],
function (Stealth, Bitcoin, Mnemonic, multiParty) {
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
  Transport.prototype.initChannel = function(pairCode) {
      var channel;
      if (this.channels[pairCode]) {
          channel = this.channels[pairCode];
      } else {
          channel = new Channel(this, pairCode);
          this.channels[pairCode] = channel;
      }
      channel.sendOpening();
      return channel;
  }



  /************************************
   * Channel
   */
  function Channel(transport, pairCode) {
      var self = this;
      var client = transport.client;
      var pairCodeHash = transport.hashChannelName(pairCode);
      this.transport = transport;
      this.pairCode = pairCode;
      this.channelHash = pairCodeHash;
      // chan tests
      if (this.subscribed != pairCodeHash) {
        var _onChannelData = function(_data) {self.onChannelData(_data);};
        if (client.handler_map["chan.update." + pairCodeHash]) {
            // update callback
            client.handler_map["chan.update." + pairCodeHash] = _onChannelData;
        } else {
            this.channelSubscribe(function(err, data){
                if (!err) {
                    self.subscribed = pairCodeHash;
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
      var client = this.transport.client;
      client.chan_subscribe("b", this.channelHash, callback, update_cb);
  }

  // Post to given channel
  Channel.prototype.channelPost = function(data, callback) {
      var client = this.transport.client;
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


  return {
    Transport: Transport
  }
});
