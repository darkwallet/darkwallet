'use strict';

define(['bitcoinjs-lib'], function(Bitcoin) {

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

  // Contact Pairing
  ContactMsg: function(identity) {
    var data = {};
    var wallet = identity.wallet;
    var address = wallet.getAddress([0]);
    var mpk = address.mpk;
    data['name'] = identity.name;
    data['stealth'] = address.stealth;
    return Protocol.packMessage('Contact', data);
  },
  // Chatting
  ShoutMsg: function(text) {
    return Protocol.packMessage('Shout', {"text": text});
  },
  // Multisig specific
  MultisigAnnounceMsg: function(multisig) {
    var data = {};
    data['multisig'] = multisig;
    return Protocol.packMessage('MultisigAnnounce', data);
  },
  MultisigProposalMsg: function(proposal) {
    var data = {};
    data['proposal'] = proposal;
    return Protocol.packMessage('MultisigProposal', data);
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
	answer['text'][fingerprint]['message'] = convert.bytesToBase64(pubKey.toByteArrayUnsigned());
	return answer;
  }
};

return Protocol;

});
