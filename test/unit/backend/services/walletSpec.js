/*
 * @fileOverview Background service running for the wallet
 */
'use strict';

define(['testUtils', 'bitcoinjs-lib', 'util/btc'], function(testUtils, Bitcoin, BtcUtils) {
  var testTx = "01000000024b29c7abd143582985ab746905cd79731fbe953b93413dcc486f0409b9ce62890000000000ffffffffc7052b97e8d78df0ec6cc17f96e645360835c9a1105963ef726fd879cc8271210000000000ffffffff02c09ee605000000001976a914f587db9cc12fb50bd877475d73a62a8059e7054388acc09ee605000000001976a9141db621e7447d279d4267f0517e58330d0f89e53d88ac00000000";
  var blockHeader = "020000002e3fa5a84b6f541d7126ea46e89ff2fb263888526bacfc0d0000000000000000c323ea4dd6664bcba6df32875eaed45be95bf8735b5f50ed6240346aa54ff39ae8314a54c08d1e18e579e44a";
  var lastBlock, lastTimestamp, blockDiff;

  describe('Wallet service', function() {
    var Port, walletService, keyRing, core, identity;
    beforeEach(function(done) {
      lastBlock = BtcUtils.lastBlock;
      lastTimestamp = BtcUtils.lastTimestamp;
      blockDiff = BtcUtils.blockDiff;

      testUtils.stub('backend/port', {
        listen: function(service, callback) {
          callback({type: 'connected'});
        },
        post: function(service, obj) {}
      });
      testUtils.stub('dwutil/tasks/transaction', {
        processRow: function() {},
        processHistory: function() {},
        processHeight: function() {},
        processSpend: function() {return {label: 'spendTask'}},
        processRadar: function() {}
      });

      var store = {
          set: function() {},
          get: function() {return 0;}
      }
      identity = {
        name: 'alice',
        txdb: {
          setLabel: function() {}
        },
        tasks: {
          addTask: function() {}
        },
        history: {
          fillHistory: function() {}
        },
        wallet: {
          getWalletAddress: function() {return {index: 0};},
          processHistory: function() {},
          getPrivateKey: function(index, pass, cb) { cb(Bitcoin.ECKey.fromWIF("Kwi6e7qyemChBmPm1ySD8VR99eGNfE74iQDp8Q5PFKri6mgoUkFf")) },
          pockets: {
            getAddressPocketId: function() {return 0;}
          }
        },
        tx: {
          process: function() {},
          sign: function(newTx, utxo, pass, cb) { cb(null, [1, 2]) }
        },
        store: store
      };
      testUtils.stub('model/keyring', function() {
          this.identities={'alice': identity};
          this.availableIdentities=['alice'];
          this.createIdentity = function(name){return {name: name, history: {}, store: store}};
          this.rename = function(oldname, newname, cb){ cb();};
          this.close = function(){};
          this.save = function(name, data, cb){ cb();};
          this.get = function(name, cb){ cb(identity)};
      });
      var client = {
          subscribe: function(address, cb) {cb();},
          unsubscribe: function(address, cb) {cb();},
          broadcast_transaction: function(txHex, cb) {cb(null, 0.5, 'radar');},
          fetch_history: function(address, height, cb) {cb(null, []);},
          fetch_last_height: function(cb) {cb(null, 326765);},
          fetch_block_header: function(height, cb) {cb(null, blockHeader);}
      };
      core = {
        getCurrentIdentity: function() {return identity;},
        getClient: function() {return client;},
        service: {
          badge: {
            setItems: function(){}
          },
          notifier: {
            post: function(){}
          },
          safe: {
            set: function(){return "xxx";}
          },
          mixer: {
            startTask: function(){}
          },
          stealth: {
            fetch: function(){},
            initWorker: function(){}
          },
          multisigTrack: {
            spend: function(){},
            processTx: function(){}
          }
        },
        servicesStatus: {
          syncing: 0
        }
      };
      testUtils.loadWithCurrentStubs('backend/services/wallet', function(WalletService) {
        walletService = new WalletService(core);
        Port = require('backend/port');
        keyRing = walletService.getKeyRing();
        spyOn(keyRing, 'close');
        spyOn(core.service.badge, 'setItems');
        spyOn(core.service.mixer, 'startTask');
        spyOn(identity.txdb, 'setLabel');
        spyOn(identity.tx, 'process');
        spyOn(identity.tasks, 'addTask');
        spyOn(Port, 'post');
        done();
      });
    });

    afterEach(function(done) {
      BtcUtils.lastBlock = lastBlock;
      BtcUtils.lastTimestamp = lastTimestamp;
      BtcUtils.blockDiff = blockDiff;
      done();
    });

    it('creates the service', function() {
      expect(walletService.name).toBe('wallet');
    });

    it('loads an identity', function() {
      var called;
      walletService.loadIdentity(0, function() {called=true});
      expect(called).toBe(true);
    });

    it('gets an identity', function() {
      walletService.loadIdentity(0, function() {});
      var alice = walletService.getIdentity(0);
      expect(alice.name).toBe('alice');

      var current = walletService.getIdentity();
      expect(current.name).toBe('alice');
    });


    it('reloads an identity', function() {
      walletService.loadIdentity(0, function() {});
      var called;
      walletService.reloadIdentity(identity, function() {called=true});
      expect(called).toBe(true);
    });

    it('renames an identity', function() {
      walletService.loadIdentity(0, function() {});
      var called;
      walletService.renameIdentity('bob', function() {called=true});
      expect(called).toBe(true);
      expect(identity.name).toBe('bob');
    });

    it('creates an identity', function() {
      walletService.loadIdentity(0, function() {});
      var loaded;
      walletService.createIdentity('bob', 'bitcoin', 'dead', 'pass', function(identity) {loaded=identity});
      expect(loaded.name).toBe('bob');
    });

    it('inits an address', function() {
      walletService.loadIdentity(0, function() {});
      walletService.initAddress({address: 'bla', history: [1, 2]});
      expect(Port.post).toHaveBeenCalledWith('gui', {type: 'balance', pocketId: 0});
    });

    it('removes an address', function() {
      walletService.loadIdentity(0, function() {});
      var called;
      walletService.removeAddress({address: 'bla'}, function() {called=true;});
      expect(called).toBe(true);
    });

    it('fetches height', function() {
      walletService.loadIdentity(0, function() {});
      walletService.fetchHeight();
      walletService.initAddress({address: 'bla', history: [1, 2]});
      expect(Port.post).toHaveBeenCalledWith('gui', {type: 'balance', pocketId: 0});
      expect(Port.post).toHaveBeenCalledWith('gui', {type: 'height', value: 326765});
      expect(Port.post).toHaveBeenCalledWith('wallet', {type: 'height', value: 326765});
      expect(Port.post).toHaveBeenCalledWith('gui', {type: 'timestamps', value: {height: 326765, timestamp: 1414148584}});
      expect(walletService.currentHeight).toBe(326765);
      expect(core.service.badge.setItems).toHaveBeenCalledWith(identity);
      expect(core.servicesStatus.syncing).toBe(0);
    });

    it('signs a tx', function() {
      walletService.loadIdentity(0, function() {});
      var newTx = Bitcoin.Transaction.fromHex(testTx);
      var metadata = {};
      var result;
      var cb = function(err, data) {
          if (!err) result = data;
      };
      identity.tx.sign = function(newTx, utxo, pass, cb) { cb(null, []) };
      walletService.signTransaction(newTx, metadata, 'pass', cb, false);
      expect(result.tx.version).toEqual(1);
      expect(result.type).toEqual('signed');
    });

    it('signs a tx with broadcast', function() {
      walletService.loadIdentity(0, function() {});
      var newTx = Bitcoin.Transaction.fromHex(testTx);
      var metadata = {label: 'foo'};
      var result;
      var cb = function(err, data) {
          if (!err) result = data;
      };
      identity.tx.sign = function(newTx, utxo, pass, cb) { cb(null, []) };
      walletService.signTransaction(newTx, metadata, 'pass', cb, true);
      expect(result.type).toEqual('radar');
      expect(result.radar).toEqual(0.5);
    });

    it('signs a tx with error', function() {
      walletService.loadIdentity(0, function() {});
      var newTx = Bitcoin.Transaction.fromHex(testTx);
      var metadata = {label: 'foo'};
      var called;
      var cb = function(err, data) {
          if (err) called = true;
      };
      identity.tx.sign = function(newTx, utxo, pass, cb) { cb('error') };
      walletService.signTransaction(newTx, metadata, 'pass', cb, true);
      expect(called).toEqual(true);
    });

    it('signs a tx with pending', function() {
      walletService.loadIdentity(0, function() {});
      var newTx = Bitcoin.Transaction.fromHex(testTx);
      var metadata = {};
      var result;
      var cb = function(err, data) {
          if (!err) result = data;
      };
      identity.tx.sign = function(newTx, utxo, pass, cb) { cb(null, [1, 2]) };
      walletService.signTransaction(newTx, metadata, 'pass', cb, false);
      expect(result.tx.version).toEqual(1);
      expect(result.type).toEqual('signatures');
    });

    it('broadcasts a tx', function() {
      var newTx = Bitcoin.Transaction.fromHex(testTx);
      var task = {label: 'sending'};
      var called = false;
      walletService.loadIdentity(0, function() {called=true;});
      expect(called).toBe(true);
      var radar = false;
      walletService.broadcastTx(newTx, task, function(err, data) {radar=data;});
      expect(radar.type).toBe('radar');
      expect(radar.radar).toBe(0.5);
      expect(Port.post).toHaveBeenCalledWith('gui', {type: 'radar', count: 0.5})
      expect(identity.txdb.setLabel).toHaveBeenCalled();
    });

    it('sends a fallback', function() {
      walletService.loadIdentity(0, function() {});
      var task = {label: 'sending'};
      walletService.sendFallback('mixer', {fallback: testTx});
      expect(Port.post).toHaveBeenCalledWith('gui', {type: 'radar', count: 0.5})
      expect(core.service.badge.setItems).toHaveBeenCalledWith(identity);
      expect(identity.txdb.setLabel).toHaveBeenCalled();
    });

    it('mixes a transaction', function() {
      var newTx = Bitcoin.Transaction.fromHex(testTx);
      walletService.loadIdentity(0, function() {});
      var metadata = {total: 10000,
                      label: 'sending',
                      fee: 1000,
                      change: 100000,
                      utxo: [{address: 'foo'}],
                      myamount: 10000};
      var result;
      identity.tx.sign = function(newTx, utxo, pass, cb) { cb(null, []) };
      walletService.mixTransaction(newTx, metadata, 'pass', function(err, data) {result=data||err});
      expect(result.type).toBe('mixer');
      expect(result.task.state).toBe('announce');
      expect(result.task.label).toBe(metadata.label);
      expect(result.task.fee).toBe(metadata.fee);
      expect(result.task.change).toBe(metadata.change);
      expect(core.service.mixer.startTask).toHaveBeenCalled();
      expect(identity.tasks.addTask).toHaveBeenCalled();
    });


  });
 
});

