importScripts('/js/backend/workers/loader.js');

// workaround for sjcl looking for window
var window = self;

require(['bitcoinjs-lib', 'util/djbec', 'util/encryption', 'sjcl'], function(Bitcoin, Curve25519, Encryption) {

  var BigInteger = Bitcoin.BigInteger;

  /**
   * Callback for messages coming from the application
   */
  self.onmessage = function (oEvent) {
    if (oEvent.data.type == 'channelData') {
        var data = oEvent.data;
        var msg = onChannelData(data.channelName, data.channelPriv, data.scanKey, data.message);
        if (msg) {
            msg.channelName = data.channelName;
            postMessage(msg);
        }
    } else {
        console.log("Message not recognized " + oEvent.data);
    }
  };

  /**
   * Decrypt a beacon
   */
  var decryptBeacon = function(scanKey, data, pk2) {
      var shared = Curve25519.ecDH(scanKey.priv, pk2);
      shared = shared.toByteArrayUnsigned();
      shared = Curve25519.bytes2string(shared);
      return sjcl.decrypt(shared, data.data);
  }

  /**
   * Receive a beacon
   */
  var onReceiveBeacon = function(scanKey, data) {
      var decrypted;
      var pk2 = BigInteger.fromByteArrayUnsigned(data.pubKey);
      // Decrypt for our scankey may be a beacon
      try {
          decrypted = decryptBeacon(scanKey, data, pk2);
      } catch (err) {
          // message is not for us.. ignore     
          console.log("[catchan] Encrypted message not for us", err)
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

      var fingerprint = Encryption.genFingerprint(data.pubKey);
      return {type: 'beacon', data: decoded, peer: {pubKey: data.pubKey, fingerprint: fingerprint}};
  }
 
  /**
   * Receive a dh message for our cloak
   */
  var onReceiveDH = function(channelPriv, data) {
      var otherKey = data.pubKey;
      var pk2 = BigInteger.fromByteArrayUnsigned(otherKey);
      var shared = Curve25519.ecDH(channelPriv, pk2);

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
      return {type: 'personal', data: decoded, peer: {pubKey: otherKey, fingerprint: fingerprint}};
  };

  /**
   * Receive channel data
   */
  var onChannelData = function(channelName, channelPriv, scanKey, message) {
      var decrypted;
      var decoded = JSON.parse(message.data);

      // An encrypted message coming on the channel
      if (decoded.cipher) {
          // channel layer
          try {
              decrypted = sjcl.decrypt(channelName, message.data);
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
          if (decoded.type == 'publicKey') {
              return {type: 'publicKey', data: decoded};
          }
          else if (decoded.type == 'personal') {
              console.log("[catchan] Decoding DH message");
              var msg = onReceiveDH(channelPriv, decoded);
              if (!msg) {
                  msg = onReceiveBeacon(scanKey, decoded);
              }
              // don't want to trigger normal callbacks here.
              return msg;
          }
          return {type: 'channel', data: decoded};
      }
  };

});

