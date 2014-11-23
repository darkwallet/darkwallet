'use strict';

define(['bitcoinjs-lib', 'util/djbec'], function(Bitcoin, Curve25519) {

var convert = Bitcoin.convert;

var Protocol = {
  packMessage: function(type, data) {
    var request = {}
    request['type'] = type;
    request['body'] = data;
    return request;
  },

  // CoinJoin Messages
  CoinJoinOpenMsg: function(id, amount) {
    var data = {};
    data['id'] = id;
    data['amount'] = amount;
    return Protocol.packMessage('CoinJoinOpen', data);
  },

  CoinJoinMsg: function(id, tx) {
    var data = {};
    data['id'] = id;
    data['tx'] = tx;
    return Protocol.packMessage('CoinJoin', data);
  },

  CoinJoinFinishMsg: function(id) {
    return Protocol.packMessage('CoinJoinFinish', {id: id});
  },

  // Simple Contact
  ContactMsg: function(identity) {
    var data = {};
    var wallet = identity.wallet;
    var address = wallet.getAddress([0]);
    var mpk = address.mpk;
    data['name'] = identity.name;
    data['stealth'] = address.stealth;
    return Protocol.packMessage('Contact', data);
  },
  // Pairing message
  PairMsg: function(name, signKey, scanKeyPub, address) {
    var scanBytes = scanKeyPub.toBuffer().toJSON().data;
    var id = 'PSI'+Bitcoin.base58check.encode(new Bitcoin.Buffer([1].concat(scanBytes.concat(signKey.pub))));
    var data = {};
    data['nick'] = name;
    data['pub'] = id;
    data['address'] = address;

    var toSign = data['address']+data['nick']+data['pub'];
    data['sig'] = Curve25519.signature(toSign, signKey.priv, signKey.pub);

    return Protocol.packMessage('Pair', data);
  },
  // Encrypted for other's beacon key
  BeaconMsg: function(ephemKey, signKey) {
    var data = {};
    data['pub'] = convert.bytesToString(signKey.pub);
    data['ephem'] = convert.bytesToString(ephemKey.toBuffer().toJSON().data);

    var toSign = data['ephem']+data['pub'];
    data['sig'] = Curve25519.signature(toSign, signKey.priv, signKey.pub);

    return Protocol.packMessage('Beacon', data);
  },
  // Chatting
  ShoutMsg: function(text) {
    return Protocol.packMessage('Shout', {"text": text});
  },
  // Multisig specific
  MultisigAnnounceMsg: function(script) {
    var data = {};
    data['script'] = script;
    return Protocol.packMessage('MultisigAnnounce', data);
  },
  MultisigAckMsg: function(id) {
    var data = {};
    data['id'] = id;
    return Protocol.packMessage('MultisigAck', data);
  },
  MultisigSpendMsg: function(address, tx) {
    var data = {};
    data['address'] = address;
    data['tx'] = tx;
    return Protocol.packMessage('MultisigSpend', data);
  },
  MultisigSignMsg: function(address, txHash, sigs) {
    var data = {};
    data['address'] = address;
    data['hash'] = txHash;
    data['sig'] = sigs;
    return Protocol.packMessage('MultisigSign', data);
  },
  // Key exchange
  PublicKeyRequestMsg: function(fingerprint) {
	var request = {};
	request['type'] = 'publicKeyRequest';
	request['text'] = {};
	request['text'][fingerprint] = {};
	return request;
  },
  PublicKeyMsg: function(fingerprint, pubKey) {
	var answer = {};
	answer['type'] = 'publicKey';
	answer['text'] = {};
	answer['text'][fingerprint] = {};
	answer['text'][fingerprint]['message'] = pubKey.toBuffer().toString('base64');
	return answer;
  }
};

return Protocol;

});
