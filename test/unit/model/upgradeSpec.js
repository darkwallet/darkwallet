/**
 * @fileOverview Mapping coordinating with the app's database.
 */
'use strict';

define(['model/upgrade'], function(Upgrade) {
 
  /**
   * Model upgrade original version, just wipes out the store
   */
  describe('Model upgrade', function() {
    var store;
 
    beforeEach(function() {
      store = {pubkeys: {}, contacts: [], pockets: [], scankeys: ['foo'], mpk: "xpub6AANPpdT4JoeTLrgN159eHQXT4X1YiCtXnAJLV5zF48K2iDWWc1S7eYNFGe3oT2W5vDeFYHpWS8Y3Jr3xXeXFn18W6jMU9DhE3VG9mhyayG"};
    });

    it('checks for no upgrade', function() {
      store.version = 5;
      var res = Upgrade(store);
      expect(res).toBe(false);
    });

    it('checks for reseed from 4 to 5', function() {
      store.version = 4;
      var res = Upgrade(store);
      expect(res).toBe(true);
      expect(store.reseed).toBe(true);
    });

    it('reseeds from 4 to 5', function() {
      var privData = {
          privKey: 'somekey',
          privKeys: 'bar',
          seed: 'aaaaabbbbbbccccccc',
      };
      var identity = {
          generate: function() {
              privData.privKey = 'newkey';
              identity.store.store.mpk = 'newmpk';
          },
          wallet: {
              pubKeys: [],
          },
          store: {
              get: function(name) { return this.store[name]; },
              set: function(name, val) { this.store[name] = val; },
              getPrivateData: function(pass) {return privData; },
              setPrivateData: function(data, pass) {privData=data; },
              store: {version: 4, mpk: 'somempk'}
          }
      }
      // set version and trigger reseed request
      store.version = 4;
      var res = Upgrade(identity.store.store);
      expect(identity.store.store.reseed).toBe(true);

      // reseed
      var res = Upgrade(identity.store.store, identity, 'pass');
      expect(res).toBe(true);

      // check private data
      var newData = identity.store.getPrivateData();
      expect(newData.privKey).toBe('newkey');
      expect(newData.oldPrivKey).toBe('somekey');
      expect(newData.privKeys).toBe(privData.privKeys);

      // check identity
      expect(identity.store.store['old-mpk']).toBe('somempk');
      expect(identity.store.store['mpk']).toBe('newmpk');
      expect(identity.store.store.reseed).toBe(false);
      expect(identity.reseed).toBe(false);
      expect(identity.wallet.mpk).toBe('newmpk');
      expect(identity.wallet.oldMpk).toBe('somempk');
    });


    it('runs with no mpk', function() {
      store.mpk = undefined;
      var res = Upgrade(store);
      expect(res).toBe(true);
    });

    it('it upgrades contacts from dict properly', function() {
      store.contacts = {1: 2};
      var res = Upgrade(store);
      expect(res).toBe(true);
      expect(store.contacts).toEqual([]);
    });

    it('cleans up contacts', function() {
      store.contacts = [{},{},null,{}];
      var res = Upgrade(store);
      expect(res).toBe(true);
      expect(store.contacts).toEqual([{},{},{}]);
    });


    it('it upgrades and cleans up pubkeys', function() {
      store.pubkeys = {};
      store.pubkeys[[0,0]] = {index: [0,1]};
      store.pubkeys[[0,1]] = {};
      store.pubkeys[[0,2]] = null;
      var res = Upgrade(store);
      expect(res).toBe(true);
      expect(store.pubkeys).toEqual({"0,0": {index: [0,1]}});
    });

    it('it generates missing mpk', function() {
      store.pubkeys = {};
      store.pubkeys[[0]] = {index: [0]};
      var res = Upgrade(store);
      expect(res).toBe(true);
      expect(store.pubkeys[0].mpk).toEqual("xpub6BmQ54gaEjch9GatbNFvmTfXAwgFE3RMURnBshMBg61jKmfaE9oQwxPBw5wUB9Ez65zJ4QBDkfzSorJzyLwQXQRETFLhksaAqSfMSDYBrVA");
    });

    it('upgrades the pocket store', function() {
      store.pockets = ["spending", "savings"];
      var res = Upgrade(store);
      expect(res).toBe(true);
      expect(store.pockets).toEqual([{name: 'spending'}, {name: 'savings'}]);
    });

    it('checks for no scankeys', function() {
      store.scankeys = null;
      var res = Upgrade(store);
      expect(res).toBe(true);
      expect(store.reseed).toBe(true);
    });


 
  });

});
