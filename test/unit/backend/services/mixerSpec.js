/*
 * @fileOverview Background service running for the wallet
 */
'use strict';

define(['testUtils', 'bitcoinjs-lib', 'model/wallet'], function(testUtils, Bitcoin, Wallet) {

  var BTC = 99000000;
  var mBTC = 100000;

  // 0. Initiator blueprint
  var txInitiator = new Bitcoin.Transaction();
  txInitiator.addInput("217182cc79d86f72ef635910a1c935083645e6967fc16cecf08dd7e8972b05c7:0"); // 1 BTC 1Fufjpf9RM2aQsGedhSpbSCGRHrmLMJ7yY
  txInitiator.addOutput("13i6nM6iauwi3H4cDk77Nu4NY5Y1bKk3Wd", 99000000);
  var txInitiatorHex = txInitiator.serializeHex();



  // 1. Guest blueprint and inital tx
  var txGuest = new Bitcoin.Transaction();
  txGuest.addInput("8962ceb909046f48cc3d41933b95be1f7379cd056974ab85295843d1abc7294b:0"); // 1 BTC 19TVp7iN6FjSQJTA6DNS9nfauR6PM3Mb8N
  txGuest.addOutput("1PPFJZx5TWRwwVkLd3kpuALPfU5u2coybh", 99000000);
  var txGuestHex = txGuest.serializeHex();
  var txFullfilledHex = '01000000014b29c7abd143582985ab746905cd79731fbe953b93413dcc486f0409b9ce62890000000000ffffffff01c09ee605000000001976a914f587db9cc12fb50bd877475d73a62a8059e7054388ac00000000';

 
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

    var core, mixer, Port, MixerClass, tasks, hdPockets, openingMsg, acceptMsg, fullfillMsg, primedGuestCoinJoin;
    
    beforeEach(function(done) {
      
      testUtils.stub('backend/port', {
        connect: function(service, callback) {
          callback({type: 'connected'});
        },
        post: function(service, obj) {}
      });

      tasks = [];      
      hdPockets = [];      

      core = {
        service: {
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
                outputs: {"8962ceb909046f48cc3d41933b95be1f7379cd056974ab85295843d1abc7294b:0": {address: '1PPFJZx5TWRwwVkLd3kpuALPfU5u2coybh'}}
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
      hdPockets = [{name: 'foo', mixing: true}];
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

    it('starts mixing because a there is a pending task', function() {
      tasks = [{state: 'paired'}]
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

    it('host starts announcing', function() {
      tasks = [{state: 'announce', myamount: BTC, tx: txInitiator.serialize(), timeout: 0, fee: mBTC}]
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
      tasks = [{state: 'announce', myamount: BTC, tx: "foo", timeout: 0, fee: mBTC}]
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

      expect(hostMixer.channel.posted.length).toBe(1);
      expect(hostMixer.channel.dhposted.length).toBe(1);

      var pubKey = hostMixer.channel.dhposted[0][0];
      fullfillMsg = hostMixer.channel.dhposted[0][1];

      expect(pubKey).toBe("guestPubKey");
      expect(fullfillMsg.type).toBe("CoinJoin");
      expect(fullfillMsg.body.id).toBe(acceptMsg.body.id);
      expect(fullfillMsg.body.tx).toBe(txFullfilledHex);

    });

    it('guest evaluates a fullfill', function() {
      var privKeys = '{"iv":"N7HX6P3aXC6Q3jAWMEsrDw==","v":1,"iter":1000,"ks":128,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hEz5tH65WW2gURLtPbWaIA==","ct":"NXx7Tngzw/FSPrpuPN7SxvJSwE8ZhqSvi6QDW3QiUjFa/SwN38ud0khUNg4GE5wM/+FqMnABLaO70KSWRIG5qkNG4HU0LMjo+cynGY/e+sdWHdhafF5ZP4j4EZlMZT/tUi9T7jUhmX6DpxygxS+x6rm3yhoJEgk="}';
      hdPockets = [{name: 'foo', mixing: true, privKey: privKeys, privChangeKey: privKeys}];
      var guestMixer = new MixerClass(core);
      guestMixer.channel.fingerprint = 'guest';
      guestMixer.ongoing[fullfillMsg.body.id] = primedGuestCoinJoin;


      fullfillMsg.peer = {trusted: true, pubKey: 'hostPubKey'};

      // Accept the message
      guestMixer.onCoinJoin(fullfillMsg);

      // Perform checks
      expect(Object.keys(guestMixer.ongoing).length).toBe(1);

      var coinJoin = guestMixer.ongoing[acceptMsg.body.id];
      expect(coinJoin.state).toBe('signed');

      expect(guestMixer.channel.posted.length).toBe(0);
      expect(guestMixer.channel.dhposted.length).toBe(1);

      var pubKey = guestMixer.channel.dhposted[0][0];
      fullfillMsg = guestMixer.channel.dhposted[0][1];

      expect(pubKey).toBe("hostPubKey");
      expect(fullfillMsg.type).toBe("CoinJoin");
      expect(fullfillMsg.body.id).toBe(acceptMsg.body.id);
      expect(fullfillMsg.body.tx).toBe('01000000014b29c7abd143582985ab746905cd79731fbe953b93413dcc486f0409b9ce6289000000008c493046022100b1a855fbdfa4b94b87cc1d6a098f382e7d0f8bb307acd246fe6ba4c4a47b8009022100f599f9303be10a018fbaad315e148161ad78f58f91a99b332a997dede81ca3e10141049601c77d65c91de169447fae2e39d6bcbc875a62e4bb3f8525e65f32af79b7e16027f6a44f9df527da837cdb6c71f7439c58a0a08896ff7ed408c053d7f35fa3ffffffff01c09ee605000000001976a914f587db9cc12fb50bd877475d73a62a8059e7054388ac00000000');

    });
    
  });


});

