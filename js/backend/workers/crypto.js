
importScripts('/js/backend/workers/loader.js');

// workaround for sjcl looking for window
var window = self;

require(['bitcoinjs-lib', 'util/djbec', 'util/encryption', 'util/protocol', 'sjcl'], function(Bitcoin, Curve25519, Encryption, Protocol) {

  var BigInteger = Bitcoin.BigInteger;

  /**
   * Callback for messages coming from the application
   */
  self.onmessage = function (oEvent) {
    var msg;
    var data = oEvent.data;
    if (data.type == 'postDH') {
        msg = postDH(data.fingerprint, data.channelName, data.otherKey, data.privKey, data.pubKey, data.data);
    } else if (data.type == 'postEncrypted') {
        msg = postEncrypted(data.fingerprint, data.channelName, data.data, data.hiding);
    } else if (data.type == 'buildBeacon') {
        msg = buildBeacon(data.pubKey, data.signKey);
    } else {
        console.log("Message not recognized", oEvent.data);
    }
    if (msg) {
        postMessage({payload: msg, id: data.id});
    }
  };

  /**
   * Encrypt and format a message for the channel
   */
  function postEncrypted(fingerprint, channelName, data, hiding) {
    if (!hiding) {
          data.sender = fingerprint;
    }
    return sjcl.encrypt(channelName, JSON.stringify(data), {ks: 256, ts: 128});
  }

  /**
   * Encrypt and format a message for the channel and dh encrypt it for some other key
   */
  function postDH(fingerprint, channelName, otherKey, privKey, myPub, data) {
    var myPrivKey = BigInteger.fromByteArrayUnsigned(privKey);
    var pk2 = BigInteger.fromByteArrayUnsigned(otherKey);
    var shared = Curve25519.ecDH(myPrivKey, pk2);
    data.pubKey = myPub;

    shared = shared.toBuffer().toJSON().data;
    shared = Curve25519.bytes2string(shared);

    var encrypted = sjcl.encrypt(shared, JSON.stringify(data), {ks: 256, ts: 128});
    var msg = {'type': 'personal', 'data': encrypted, 'pubKey': myPub};
    return postEncrypted(fingerprint, channelName, msg);
  }

  function buildBeacon(pubKey, signKey) {
    pubKey = BigInteger.fromByteArrayUnsigned(pubKey);
    return Protocol.BeaconMsg(pubKey, signKey);
  }

});

