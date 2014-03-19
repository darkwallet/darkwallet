define(['stealth', 'bitcoinjs-lib', 'mnemonicjs', 'util/multiParty'],
function (Stealth, Bitcoin, Mnemonic, multiParty) {
  'use strict';

  var CryptoJS = Bitcoin.Crypto;
  var SHA256 = Bitcoin.Crypto.SHA256;

  function Transport(identity, client) {
    this.client = client;
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

  // Subscribe to given channel
  Transport.prototype.channelSubscribe = function(channel, callback, update_cb) {
        var client = this.client;
        var channelHash = this.hashChannelName(channel);
        client.chan_subscribe("b", channelHash, callback, update_cb);
  }

  // Post to given channel
  Transport.prototype.channelPost = function(channel, data, callback) {
        var client = this.client;
        var channelHash = this.hashChannelName(channel);
        client.chan_post("b", channelHash, data, callback);
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


  // Callback for data received on channel
  Transport.prototype.onChannelData = function(pairCodeHash, message) {
        var sessionKey = this.getSessionKey();
        console.log("data for channel", message);
        var decrypted;
        var decoded = JSON.parse(message.data);
        // Just an encrypted message
        if (decoded.cipher) {
            decrypted = sjcl.decrypt(pairCodeHash, message.data);
            var decryptedBytes = Bitcoin.convert.hexToBytes(decrypted);
            if (decrypted != this.comms.pubKeyHex) {
                if (this.peerIds.indexOf(decrypted) == -1) {
                    this.addPeer(decryptedBytes);
                }
                this.startPairing(this.pairCode, decryptedBytes);
            }
        // Stealth message to us (maybe)
        } else if (decoded.pub) {
            console.log("stealth", sessionKey, decoded);
            decrypted = Stealth.decrypt(sessionKey, decoded);
        }
        if (decrypted) {
            this.requests.push({data: decrypted});
            console.log("data for channel", decrypted);
        }
        this.update();
  }

  // Start pairing with another identity
  Transport.prototype.startPairing = function(channel, pubKey) {
        // pair to a specific user session public key
        var msg = 'hello';
        var encrypted = Stealth.encrypt(pubKey, msg);
        this.channelPost(channel, JSON.stringify(encrypted), function(err, data){
            console.log("channel post2", err, data)
        });
  }

  // Action to start announcements and reception
  Transport.prototype.announceSelf = function(pairCode) {
        var self = this;
        this.pairCode = pairCode;
        var sessionKey = this.getSessionKey();
        var client = this.client;
        var pairCodeHash = this.hashChannelName(pairCode);
        var pubKeyHash = sessionKey.getPub().toHex(true);
        var encrypted = sjcl.encrypt(pairCodeHash, pubKeyHash, {ks: 256, ts: 128});
        // chan tests
        if (this.subscribed != pairCodeHash) {
            var _onChannelData = function(_data) {self.onChannelData(pairCodeHash, _data);};
            if (client.handler_map["chan.update." + pairCodeHash]) {
                // update callback
                client.handler_map["chan.update." + pairCodeHash] = _onChannelData;
            } else {
                console.log("announcing", pairCodeHash, pubKeyHash, encrypted);
                this.channelSubscribe(pairCode, function(err, data){
                    if (!err) {
                        self.subscribed = pairCodeHash;
                    }
                    console.log("channel subscribed", err, data)
                }, _onChannelData);
            }
        }
        this.channelPost(pairCode, encrypted, function(err, data){
            console.log("channel post", err, data)
        });
        /*
        client.chan_get("b", "announcements", function(err, data){console.log("channel get", err, data)})
        client.chan_list("b", function(err, data){console.log("channel list", err, data)})*/
  }
  return {
    Transport: Transport
  }
});
