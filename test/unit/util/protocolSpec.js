define(['util/protocol'], function(Protocol) {
  'use strict';

  describe('Protocol format', function() {
    it('packs a message', function() {
        var request = Protocol.packMessage('test', {foo: 'bar'});
        expect(request.type).toBe('test');
        expect(request.body).toEqual({foo: 'bar'});
    });

    it('creates a coinjoin open message', function() {
        var request = Protocol.CoinJoinOpenMsg('id', 10000);
        expect(request.type).toBe('CoinJoinOpen');
        expect(request.body).toEqual({id: 'id', amount: 10000});
    });

    it('creates a coinjoin message', function() {
        var request = Protocol.CoinJoinMsg('id', "deadbeef");
        expect(request.type).toBe('CoinJoin');
        expect(request.body).toEqual({id: 'id', tx: "deadbeef"});
    });

    it('creates a coinjoin finish message', function() {
        var request = Protocol.CoinJoinFinishMsg('id');
        expect(request.type).toBe('CoinJoinFinish');
        expect(request.body).toEqual({id: 'id'});
    });

    it('creates a contact message', function() {
        var address = {mpk: 'mpk', stealth: 'stealth'};
        var identity = {
          name: 'Delirium',
          wallet: { getAddress: function(){ return address} }
        };
        var request = Protocol.ContactMsg(identity);
        expect(request.type).toBe('Contact');
        expect(request.body).toEqual({name: 'Delirium', stealth: 'stealth'});
    });

    it('creates a shout message', function() {
        var request = Protocol.ShoutMsg("foo");
        expect(request.type).toBe('Shout');
        expect(request.body).toEqual({text: "foo"});
    });

    it('creates a multisig announce message', function() {
        var request = Protocol.MultisigAnnounceMsg("deadbeef");
        expect(request.type).toBe('MultisigAnnounce');
        expect(request.body).toEqual({multisig: "deadbeef"});
    });

    it('creates a multisig proposal message', function() {
        var request = Protocol.MultisigProposalMsg("deadbeef");
        expect(request.type).toBe('MultisigProposal');
        expect(request.body).toEqual({proposal: "deadbeef"});
    });
  });
 
});
