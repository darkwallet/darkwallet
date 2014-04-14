define(function() {

var Protocol = {
  packMessage: function(type, data) {
    var request = {}
    request['type'] = type
    request['body'] = data
    return request;
  },

  // CoinJoin Messages
  CoinJoinOpenMsg: function(id, amount) {
    var data = {};
    data['id'] = id;
    data['amount'] = amount;
    return Protocol.packMessage('CoinJoinOpen', data)
  },

  CoinJoinMsg: function(id, tx) {
    var data = {};
    data['id'] = id;
    data['tx'] = tx;
    return Protocol.packMessage('CoinJoin', data)
  },

  CoinJoinFinishMsg: function(id) {
    return Protocol.packMessage('CoinJoinFinish', {id: id})
  },

  // Contact Pairing
  ContactMsg: function(identity) {
    var data = {};
    var wallet = identity.wallet;
    var address = wallet.getAddress([0]);
    var mpk = address.mpk;
    data['name'] = identity.name;
    data['stealth'] = address.stealth;
    return Protocol.packMessage('Contact', data)
  },
  // Chatting
  ShoutMsg: function(text) {
    return Protocol.packMessage('Shout', {"text": text});
  },
  // Multisig specific
  MultisigAnnounceMsg: function(multisig) {
    var data = {};
    data['multisig'] = multisig;
    return Protocol.packMessage('MultisigAnnounce', data)
  },
  MultisigProposalMsg: function(proposal) {
    var data = {};
    data['proposal'] = proposal;
    return Protocol.packMessage('MultisigProposal', data)
  }
}

return Protocol;

})
