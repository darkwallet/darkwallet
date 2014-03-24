define(function() {

var Protocol = {
  packMessage: function(type, data) {
    var request = {}
    request['type'] = type
    request['body'] = data
    return request;
  },

  CoinJoinMsg: function(amount) {
    var data = {};
    data['amount'] = amount;
    return Protocol.packMessage('CoinJoin', data)
  },

  ContactMsg: function(identity) {
    var data = {};
    var wallet = identity.wallet;
    var address = wallet.getAddress([0]);
    var mpk = address.mpk;
    data['name'] = identity.name;
    data['stealth'] = address.stealth;
    return Protocol.packMessage('Contact', data)
  },
  ShoutMsg: function(text) {
    return Protocol.packMessage('Shout', {"text": text});
  },
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
