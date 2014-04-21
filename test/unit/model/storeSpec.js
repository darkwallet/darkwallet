/**
 * @fileOverview Mapping coordinating with the app's database.
 */
'use strict';

define(['model/store'], function(Store) {
  
  var data, keyring, store;
  
  beforeEach(function() {
    data = {name: 'storeTest', bar: 'foo'};
    keyring = {
      save: function(name, data, callback) {
        callback(name, data);
      }
    };
    store = new Store(data, keyring);
  });
  
  describe('Storage model', function() {    
    it('creates properly', function() {
      expect(store.store.bar).toEqual('foo');
      expect(store.keyring).toBe(keyring);
    });

    it('gets a value from a key', function() {
      store.store.satoshi = 'nakamoto';
      expect(store.store.satoshi).toBeDefined();
      expect(store.get('satoshi')).toBe('nakamoto');
    });

    it('sets a key value pair into the store', function() {
      store.set('satoshi', 'nakamoto');
      expect(store.store.satoshi).toBeDefined();
      expect(store.store.satoshi).toEqual('nakamoto');
    });

    it('sets value to default if not defined', function() {
      expect(store.init('bar', 'z')).toBe('foo');
      expect(store.init('satoshi', 'nakamoto')).toBe('nakamoto');
    });

    it('saves the store to database', function() {
      store.save(function(name, store) {
        expect(name).toBe('storeTest');
        expect(store).toBe(store);
      });
    });

    it('sets and gets private data', function() {
      store.setPrivateData('top secret', 'p4ssw0rd');
      expect(store.store.private).toBeDefined();
      expect(store.store.private.length).toBe(190);
      expect(store.getPrivateData('p4ssw0rd')).toEqual('top secret');
      expect(function() {
        store.getPrivateData('1nc0rr3ct');
      }).toThrow();
    });
  });
});