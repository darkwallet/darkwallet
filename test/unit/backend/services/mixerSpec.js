/*
 * @fileOverview Background service running for the wallet
 */
'use strict';

define(['testUtils', 'bitcoinjs-lib', 'model/wallet', 'util/coinjoin'], function(testUtils, Bitcoin, Wallet, CoinJoin) {

  var BTC = 99000000;
  var mBTC = 100000;

  // 0. Initiator blueprint
  var txInitiator = new Bitcoin.Transaction();
  txInitiator.addInput("217182cc79d86f72ef635910a1c935083645e6967fc16cecf08dd7e8972b05c7:0"); // 1 BTC 1Fufjpf9RM2aQsGedhSpbSCGRHrmLMJ7yY
  txInitiator.addOutput("13i6nM6iauwi3H4cDk77Nu4NY5Y1bKk3Wd", 99000000);
  var txInitiatorHex = txInitiator.serializeHex();

  CoinJoin.prototype.shuffleArray = function(array) {return array};


  // 1. Guest blueprint and inital tx
  var txGuest = new Bitcoin.Transaction();
  txGuest.addInput("8962ceb909046f48cc3d41933b95be1f7379cd056974ab85295843d1abc7294b:0"); // 1 BTC 19TVp7iN6FjSQJTA6DNS9nfauR6PM3Mb8N
  txGuest.addOutput("1PPFJZx5TWRwwVkLd3kpuALPfU5u2coybh", 99000000);
  var txGuestHex = txGuest.serializeHex();
  var txFullfilledHex = '01000000024b29c7abd143582985ab746905cd79731fbe953b93413dcc486f0409b9ce62890000000000ffffffffc7052b97e8d78df0ec6cc17f96e645360835c9a1105963ef726fd879cc8271210000000000ffffffff02c09ee605000000001976a914f587db9cc12fb50bd877475d73a62a8059e7054388acc09ee605000000001976a9141db621e7447d279d4267f0517e58330d0f89e53d88ac00000000';

 
  function MockChannel(name) {
    this.callbacks = [];
    this.posted = [];
    this.dhposted = [];
    this.addCallback = function(name, cb) {
        this.callbacks.push([name, cb]);
    };
    this.postEncrypted = function(msg, cb) {
        this.posted.push([msg, cb]);
    };
    this.postDH = function(pubKey, msg, cb) {
        this.dhposted.push([pubKey, msg, cb]);
    };
  }

  describe('Mixer service', function() {

    var core, mixer, Port, MixerClass, tasks, hdPockets, broadcasted;
    var openingMsg, acceptMsg, fullfillMsg, signedMsg;
    var primedGuestCoinJoin, primedHostCoinJoin;
    
    beforeEach(function(done) {
      
      testUtils.stub('backend/port', {
        connect: function(service, callback) {
          callback({type: 'connected'});
        },
        post: function(service, obj) {}
      });

      tasks = [];      
      hdPockets = [];      
      broadcasted = [];

      core = {
        service: {
            wallet: {
                fallbacks: [],
                sendFallback: function(section, task) {core.service.wallet.fallbacks.push([section, task])},
                broadcastTx: function(tx, task, cb) {broadcasted.push([tx, task, cb])}
            },
            safe: {
                get: function(section) { return 'foo'; },
                set: function() {}
            }
        },
        getLobbyTransport: function() {
          return {
            initChannel: function(name) { return new MockChannel(name) }
          };
        },
        getCurrentIdentity: function() {
          return {
            tasks: {
              getTasks: function(section) { return tasks }
            },
            wallet: {
              get identity() {return core.getIdentity()},
              deriveHDPrivateKey: Wallet.prototype.deriveHDPrivateKey,
              getWalletAddress: function() {return {index: [0,0], address: '1PPFJZx5TWRwwVkLd3kpuALPfU5u2coybh'}},
              wallet: {
                outputs: {"8962ceb909046f48cc3d41933b95be1f7379cd056974ab85295843d1abc7294b:0": {address: '1PPFJZx5TWRwwVkLd3kpuALPfU5u2coybh'},
                          "217182cc79d86f72ef635910a1c935083645e6967fc16cecf08dd7e8972b05c7:0": {address: '1PPFJZx5TWRwwVkLd3kpuALPfU5u2coybh'}}
              },
              pockets: {
                hdPockets: hdPockets
              },
              signMyInputs: function(inputs, tx, privKeys) {
                return Wallet.prototype.signMyInputs.apply(core.getIdentity().wallet, [inputs, tx, privKeys]);
              },
              getChangeAddress: function() { return {address: '1PPFJZx5TWRwwVkLd3kpuALPfU5u2coybh'}; },
              getFreeAddress: function() { return {address: '1PPFJZx5TWRwwVkLd3kpuALPfU5u2coybh'}; },
              getBalance: function() { return {confirmed: 2*BTC, unconfirmed: 0}; },
              prepareTx: function() { return {tx: txGuest}; }
            }
          };
        },
        getIdentity: function() {return core.getCurrentIdentity()}
      };
      testUtils.loadWithCurrentStubs('backend/services/mixer', function(MixerService) {
        MixerClass = MixerService;
        var mixer1 = new MixerService(core);
        Port = require('backend/port');
        spyOn(Port, 'post');
        done();
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    });

    it('is initialized correctly', function() {
      var mixer = new MixerClass(core);
      expect(mixer.name).toEqual('mixer');
      expect(mixer.ongoing).toEqual({});
      /*expect(Port.post).toHaveBeenCalledWith('obelisk', {
        type: 'connected'
      });*/
    });

    it('starts mixing because a pocket is mixing', function() {
      hdPockets = [{name: 'foo', mixing: true},{name:'bar', mixing: false}];
      var mixer = new MixerClass(core);
      expect(mixer.name).toEqual('mixer');
      expect(mixer.ongoing).toEqual({});
      expect(mixer.channel.callbacks[0][0]).toEqual('CoinJoinOpen');
      expect(mixer.channel.callbacks[1][0]).toEqual('CoinJoin');
      expect(mixer.channel.callbacks[2][0]).toEqual('CoinJoinFinish');
      /*expect(Port.post).toHaveBeenCalledWith('obelisk', {
        type: 'connected'
      });*/
    });

    it('stops mixing', function() {
      hdPockets = [{name: 'foo', mixing: true},{name:'bar', mixing: false}];
      var mixer = new MixerClass(core);
      mixer.stopMixing();
      expect(mixer.name).toEqual('mixer');
      expect(mixer.ongoing).toEqual({});
      expect(mixer.channel).toBe(null);
      /*expect(Port.post).toHaveBeenCalledWith('obelisk', {
        type: 'connected'
      });*/
    });


    it('starts mixing because a there is a pending task', function() {
      tasks = [{state: 'paired'}, {state: 'announce', start: 300}];
      var mixer = new MixerClass(core);
      expect(mixer.name).toEqual('mixer');
      expect(mixer.channel.callbacks[0][0]).toEqual('CoinJoinOpen');
      expect(mixer.channel.callbacks[1][0]).toEqual('CoinJoin');
      expect(mixer.channel.callbacks[2][0]).toEqual('CoinJoinFinish');
      /*expect(Port.post).toHaveBeenCalledWith('obelisk', {
        type: 'connected'
      });*/

      expect(Object.keys(mixer.ongoing).length).toBe(1);

      expect(core.service.wallet.fallbacks[0][0]).toBe('mixer')
      expect(core.service.wallet.fallbacks[0][1]).toEqual({ state : 'announce', start : 300, timeout : 60 })
    });

    it('host starts announcing', function() {
      tasks = [{state: 'announce', total: BTC, myamount: BTC, tx: txInitiatorHex, timeout: 0, fee: mBTC}]
      var mixer = new MixerClass(core);
      mixer.channel.fingerprint = 'host';
      expect(mixer.name).toEqual('mixer');

      var msg = mixer.channel.posted[0][0];

      var taskId = Object.keys(mixer.ongoing)[0];
      var coinJoin = mixer.ongoing[taskId];
      expect(coinJoin.role).toEqual('initiator');
      expect(coinJoin.state).toEqual('announce');
      expect(coinJoin.myAmount).toEqual(BTC);
      expect(coinJoin.fee).toEqual(mBTC);

      expect(msg.type).toEqual('CoinJoinOpen');
      expect(msg.body.id).toEqual(taskId);
      expect(msg.body.amount).toEqual(BTC);
      /*expect(Port.post).toHaveBeenCalledWith('obelisk', {
        type: 'connected'
      });*/

      openingMsg = msg;
    });

    it('guest finds a mixing pocket', function() {
      hdPockets = [{name: 'foo', mixing: true}];
      var guestMixer = new MixerClass(core);
      guestMixer.channel.fingerprint = 'guest';

      expect(guestMixer.findMixingPocket(10*BTC)).toBe(-1);
      expect(guestMixer.findMixingPocket(BTC)).toBe(0);
    });
    
    it('guest evaluates an opening', function() {
      hdPockets = [{name: 'foo', mixing: true}];
      var guestMixer = new MixerClass(core);
      guestMixer.channel.fingerprint = 'guest';

      openingMsg.peer = {trusted: true, pubKey: 'hostPubKey'};

      // Accept the message
      guestMixer.onCoinJoinOpen(openingMsg);

      // Perform checks
      expect(Object.keys(guestMixer.ongoing).length).toBe(1);

      expect(guestMixer.channel.posted.length).toBe(0);
      expect(guestMixer.channel.dhposted.length).toBe(1);

      expect(guestMixer.channel.dhposted.length).toBe(1);

      var pubKey = guestMixer.channel.dhposted[0][0];
      acceptMsg = guestMixer.channel.dhposted[0][1];

      expect(pubKey).toBe("hostPubKey");
      expect(acceptMsg.type).toBe("CoinJoin");
      expect(acceptMsg.body).toEqual({id : openingMsg.body.id, tx : txGuestHex});

      var coinJoin = guestMixer.ongoing[openingMsg.body.id];
      expect(coinJoin.state).toBe('accepted');
      expect(coinJoin.myTx.ins.length).toBe(1);

      primedGuestCoinJoin = coinJoin;
    });

    it('host evaluates an accept', function() {
      tasks = [{state: 'announce', total: BTC, myamount: BTC, tx: txInitiatorHex, timeout: 0, fee: mBTC}]
      var hostMixer = new MixerClass(core);
      hostMixer.channel.fingerprint = 'host';

      acceptMsg.peer = {trusted: true, pubKey: 'guestPubKey'};
      acceptMsg.body.id = hostMixer.channel.posted[0][0].body.id;

      // Accept the message
      hostMixer.onCoinJoin(acceptMsg);

      // Perform checks
      expect(Object.keys(hostMixer.ongoing).length).toBe(1);

      var coinJoin = hostMixer.ongoing[acceptMsg.body.id];
      expect(coinJoin.state).toBe('fullfilled');
      expect(coinJoin.tx.ins.length).toBe(2);

      expect(hostMixer.channel.posted.length).toBe(1);
      expect(hostMixer.channel.dhposted.length).toBe(1);

      var pubKey = hostMixer.channel.dhposted[0][0];
      fullfillMsg = hostMixer.channel.dhposted[0][1];

      expect(pubKey).toBe("guestPubKey");
      expect(fullfillMsg.type).toBe("CoinJoin");
      expect(fullfillMsg.body.id).toBe(acceptMsg.body.id);
      expect(fullfillMsg.body.tx).toBe(txFullfilledHex);

      primedHostCoinJoin = coinJoin;
    });

    it('guest evaluates a fullfill', function() {
      var privKeys = '{"iv":"N7HX6P3aXC6Q3jAWMEsrDw==","v":1,"iter":1000,"ks":128,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hEz5tH65WW2gURLtPbWaIA==","ct":"NXx7Tngzw/FSPrpuPN7SxvJSwE8ZhqSvi6QDW3QiUjFa/SwN38ud0khUNg4GE5wM/+FqMnABLaO70KSWRIG5qkNG4HU0LMjo+cynGY/e+sdWHdhafF5ZP4j4EZlMZT/tUi9T7jUhmX6DpxygxS+x6rm3yhoJEgk="}';
      hdPockets = [{name: 'foo', mixing: true, privKey: privKeys, privChangeKey: privKeys}];
      var guestMixer = new MixerClass(core);
      guestMixer.channel.fingerprint = 'guest';
      guestMixer.ongoing[fullfillMsg.body.id] = primedGuestCoinJoin;

      fullfillMsg.peer = {trusted: true, pubKey: 'hostPubKey'};
      primedGuestCoinJoin.peer = fullfillMsg.peer;


      // Accept the message
      guestMixer.onCoinJoin(fullfillMsg);

      // Perform checks
      expect(Object.keys(guestMixer.ongoing).length).toBe(1);

      var coinJoin = guestMixer.ongoing[acceptMsg.body.id];
      expect(coinJoin.state).toBe('signed');
      expect(coinJoin.tx.ins.length).toBe(2);

      expect(guestMixer.channel.posted.length).toBe(0);
      expect(guestMixer.channel.dhposted.length).toBe(1);

      var pubKey = guestMixer.channel.dhposted[0][0];
      signedMsg = guestMixer.channel.dhposted[0][1];

      expect(pubKey).toBe("hostPubKey");
      expect(signedMsg.type).toBe("CoinJoin");
      expect(signedMsg.body.id).toBe(fullfillMsg.body.id);
      // outputs come randomized son cant just check this:
      //expect(signedMsg.body.tx).toBe('01000000024b29c7abd143582985ab746905cd79731fbe953b93413dcc486f0409b9ce6289000000006b4830450220244a757b5d7c2a119620183a034a25663c7c2c0e93bba7dba6130b870c33c7330221009479856c061eddfd69f43bfd435379bcb6aa993e0d29344cdf278ed1e8e3a3db0121039601c77d65c91de169447fae2e39d6bcbc875a62e4bb3f8525e65f32af79b7e1ffffffffc7052b97e8d78df0ec6cc17f96e645360835c9a1105963ef726fd879cc827121000000006c493046022100dbb4731dabe129986bae2ff7fb2c0bdf10fb2e7baa035bcf89ef0794b4361bb7022100849e00e53cb3057168c3a8d4e2683d6a915273910cafc2ed3bbfa5db221301ce0121039601c77d65c91de169447fae2e39d6bcbc875a62e4bb3f8525e65f32af79b7e1ffffffff02c09ee605000000001976a914f587db9cc12fb50bd877475d73a62a8059e7054388acc09ee605000000001976a9141db621e7447d279d4267f0517e58330d0f89e53d88ac00000000');

    });

    it('host evaluates a signed response', function() {
      var privKeys = '{"iv":"zcT9u78R6UqwOGX2g/Da3g==","v":1,"iter":1000,"ks":128,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"Zjv3lJOstugXP10T2DK0fQ==","ct":"pDC9p+GyTuFfoMb0CwvosjsBQAstAD43OZV2sO0F1Ic+NyalU2S6igdeI+D3CPn/CrHW1zEuEL4nI1FokmZQRc7t0cT0MqbZSrdBRjvhgTk8RIH4OEwQ0ESNweR+L3Jf5BBC5rLZx3tFtAa2zJELB3nqbYH6Ijtrpen+GWrWKhPkBH9sWprp"}';
      tasks = [primedHostCoinJoin.task];
      primedHostCoinJoin.task.privKeys = privKeys;
      var hostMixer = new MixerClass(core);
      hostMixer.channel.fingerprint = 'host';
      hostMixer.ongoing = {};
      hostMixer.ongoing[signedMsg.body.id] = primedHostCoinJoin;

      signedMsg.peer = {trusted: true, pubKey: 'guestPubKey'};
      primedHostCoinJoin.peer = signedMsg.peer;

      // Accept the message
      expect(hostMixer.channel.dhposted.length).toBe(0);
      hostMixer.onCoinJoin(signedMsg);

      // Perform checks
      expect(Object.keys(hostMixer.ongoing).length).toBe(0);

      expect(broadcasted.length).toBe(1);
      expect(hostMixer.channel.posted.length).toBe(0);
      expect(hostMixer.channel.dhposted.length).toBe(1);

      var pubKey = hostMixer.channel.dhposted[0][0];
      var finishedMsg = hostMixer.channel.dhposted[0][1];

      expect(pubKey).toBe("guestPubKey");
      expect(finishedMsg.type).toBe("CoinJoin");
      expect(finishedMsg.body.id).toBe(signedMsg.body.id);
      // outputs come randomized son cant just check this:
      //expect(finishedMsg.body.tx).toBe('01000000024b29c7abd143582985ab746905cd79731fbe953b93413dcc486f0409b9ce6289000000006b483045022100eba1dcb6e6023bbd854391a76752bacf075b8b2f05eb65ed6c05ea27b3fa9a5f022067a12ff4f652fbd03b095298ca56daf7d3efae76648c4d2ed1208a95cd7b56ec012102cacd99e85920821cd42a0c4369d941db3384f86a3888224d827fcac4e08d3180ffffffffc7052b97e8d78df0ec6cc17f96e645360835c9a1105963ef726fd879cc827121000000006c493046022100ad6578e5344541024756e421b52b9f89219a00502f7d4491bbe0a37e39f0bdcf022100eff8c6df21aaa6938a020ddb99ada7de9e1d6e6ccfe4cee84af78564ab2c8ee2012102cacd99e85920821cd42a0c4369d941db3384f86a3888224d827fcac4e08d3180ffffffff02c09ee605000000001976a9141db621e7447d279d4267f0517e58330d0f89e53d88acc09ee605000000001976a914f587db9cc12fb50bd877475d73a62a8059e7054388ac00000000');

    });
    
    
  });


});

