define(['util/coinjoin', 'util/protocol', 'bitcoinjs-lib'], function(CoinJoin, Protocol, Bitcoin) {
  'use strict';

  var guest;
  var initiator

  var core = {
      'foo': 'bar'
  }
  var myAmount = 99000000;
  var fee = 10000;

  var joinId = 1000;

  // 0. Initiator blueprint
  var txInitiator = new Bitcoin.Transaction();
  txInitiator.addInput("217182cc79d86f72ef635910a1c935083645e6967fc16cecf08dd7e8972b05c7:0"); // 1 BTC 1Fufjpf9RM2aQsGedhSpbSCGRHrmLMJ7yY
  txInitiator.addOutput("13i6nM6iauwi3H4cDk77Nu4NY5Y1bKk3Wd", 99000000);

  // 1. Guest blueprint and inital tx
  var txGuest = new Bitcoin.Transaction();
  txGuest.addInput("8962ceb909046f48cc3d41933b95be1f7379cd056974ab85295843d1abc7294b:0"); // 1 BTC 19TVp7iN6FjSQJTA6DNS9nfauR6PM3Mb8N
  txGuest.addOutput("1PPFJZx5TWRwwVkLd3kpuALPfU5u2coybh", 99000000);

  // 1. Guest blueprint, bad output
  var txGuestBad = new Bitcoin.Transaction();
  txGuestBad.addInput("8962ceb909046f48cc3d41933b95be1f7379cd056974ab85295843d1abc7294b:0"); // 1 BTC 19TVp7iN6FjSQJTA6DNS9nfauR6PM3Mb8N
  txGuestBad.addOutput("1PPFJZx5TWRwwVkLd3kpuALPfU5u2coybh", 49000000);


  // 2. Initiator accepting, bad
  var tx2bad = new Bitcoin.Transaction();
  tx2bad.addInput("217182cc79d86f72ef635910a1c935083645e6967fc16cecf08dd7e8972b05c7:0"); // 1 BTC 1Fufjpf9RM2aQsGedhSpbSCGRHrmLMJ7yY
  tx2bad.addOutput("13i6nM6iauwi3H4cDk77Nu4NY5Y1bKk3Wd", 99000000);
  tx2bad.addInput("8962ceb909046f48cc3d41933b95be1f7379cd056974ab85295843d1abc7294b:0"); // 1 BTC 19TVp7iN6FjSQJTA6DNS9nfauR6PM3Mb8N
  tx2bad.addOutput("13i6nM6iauwi3H4cDk77Nu4NY5Y1bKk3Wd", 99000000);

  // 2. Initiator accepting, good
  var tx2 = new Bitcoin.Transaction();
  tx2.addInput("217182cc79d86f72ef635910a1c935083645e6967fc16cecf08dd7e8972b05c7:0"); // 1 BTC 1Fufjpf9RM2aQsGedhSpbSCGRHrmLMJ7yY
  tx2.addOutput("13i6nM6iauwi3H4cDk77Nu4NY5Y1bKk3Wd", 99000000);
  tx2.addInput("8962ceb909046f48cc3d41933b95be1f7379cd056974ab85295843d1abc7294b:0"); // 1 BTC 19TVp7iN6FjSQJTA6DNS9nfauR6PM3Mb8N
  tx2.addOutput("1PPFJZx5TWRwwVkLd3kpuALPfU5u2coybh", 99000000);

  // 1.
  var msg1 = Protocol.CoinJoinMsg(joinId, txGuest.serializeHex());
  var msg1bad = Protocol.CoinJoinMsg(joinId, txGuestBad.serializeHex());
  // 2.
  var msg2 = Protocol.CoinJoinMsg(joinId, tx2.serializeHex());
  var msg2bad = Protocol.CoinJoinMsg(joinId, tx2bad.serializeHex());

  describe('CoinJoin library', function() {

    beforeEach(function() {
      initiator = new CoinJoin(core, 'initiator', 'announce', txInitiator, myAmount, fee);
      guest = new CoinJoin(core, 'guest', 'accepted', txGuest, myAmount, fee);
    });

    it('creates a guest coinjoin', function() {
        expect(guest.core).toBe(core);
        expect(guest.state).toBe('accepted');
        expect(guest.role).toBe('guest');
        expect(guest.myTx).toBe(txGuest);
        expect(guest.fee).toBe(fee);
        expect(guest.myAmount).toBe(myAmount);
    });

    it('creates an initiator coinjoin', function() {
        expect(initiator.core).toBe(core);
        expect(initiator.state).toBe('announce');
        expect(initiator.role).toBe('initiator');
        expect(initiator.myTx).toBe(txInitiator);
        expect(initiator.fee).toBe(fee);
        expect(initiator.myAmount).toBe(myAmount);
    });

    it('kills properly', function() {
        // Kill an initiator conversation
        initiator.state = 'fullfilled';
        initiator.kill();
        expect(initiator.state).toBe('announce');

        initiator.state = 'finished';
        initiator.kill();
        expect(initiator.state).toBe('finished');

        // Kill a guest conversation
        guest.state = 'accepted';
        guest.kill();
        expect(guest.state).toBe('cancelled');

        guest.state = 'finished';
        guest.kill();
        expect(guest.state).toBe('finished');
    });

    it('cancels properly', function() {
        // Cancel an initiator conversation
        initiator.state = 'fullfilled';
        initiator.cancel();
        expect(initiator.state).toBe('announce');

        initiator.state = 'finished';
        initiator.cancel();
        expect(initiator.state).toBe('announce');

        // Cancel a guest conversation
        guest.state = 'accepted';
        guest.cancel();
        expect(guest.state).toBe('cancelled');

        guest.state = 'finished';
        guest.cancel();
        expect(guest.state).toBe('cancelled');

    });

    it('checks initiator outputs and inputs found', function() {
        var res = initiator.checkMyInputsOutputs(initiator.myTx, tx2);
        expect(res).toBe(true);
    });

    it('checks initiator outputs and inputs not found', function() {
        var res = initiator.checkMyInputsOutputs(initiator.myTx, txGuest);
        expect(res).toBe(false);
    });

    it('checks guest outputs and inputs found', function() {
        var res = initiator.checkMyInputsOutputs(guest.myTx, tx2);
        expect(res).toBe(true);
    });

    it('checks guest outputs and inputs not found', function() {
        var res = initiator.checkMyInputsOutputs(guest.myTx, txInitiator);
        expect(res).toBe(false);
    });


    it('initiator starts to process', function() {
        var res = initiator.process(msg1.body);
        expect(res).toBeDefined();
        expect(initiator.state).toBe('fullfilled');
    });

    it('initiator starts to process, bad offer', function() {
        var res = initiator.process(msg1bad.body);
        expect(res).toBeUndefined();
        expect(initiator.state).toBe('announce');
    });

    xit('guest starts to process', function() {
        console.log("guest starts process");
        // TODO: signing not implemented yet...
        var res = guest.process(msg2.body);
        expect(res).toBeDefined();
        expect(guest.state).toBe('signed');
    });

    it('guest starts to process, bad message', function() {
        var res = guest.process(msg2bad.body);
        expect(res).toBeUndefined();
        expect(guest.state).toBe('accepted');
    });

  });
 
});
