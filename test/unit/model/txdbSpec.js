/*
 * @fileOverview Transaction Store
 */
'use strict';

define(['model/txdb'], function(TransactionDatabase) {
  describe('Transaction Database model', function() {
    var txdb, store, _store;
    var txHash = "a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329";
    var trans = "0100000001e5ff4507c27f122178533f07eef680bde0218ef8d731bc52fe64a898\
22ac4e36000000006a473044022034f6b4a877c1064bd58653dc102cf1187d4b33e048d1074bdd469bb\
6af21445b022068532bbbfe7c15251329a5b479a448d03d7572d0b79d5a554e87f8096cb2af57012103\
298323901ec8554099ff7e64e28195f9ae94a2f3487df56b64a7deeabf6428baffffffff027a870d000\
000000017a9140db1635fe975792a9a7b6f2d4061b730478dc6b987484f4000000000001976a9143b70\
f2aeea554b7fb7d145061efad4398879b9be88ac00000000";
    beforeEach(function() {
      store = {
        init: function(key, value) {
          return value;
        },
        save: function() {
          _store = {};
          for(var i in txdb.transactions) {
            _store[i] = txdb.transactions[i];
          }
        }
      }
      txdb = new TransactionDatabase(store);
    });
    it('is created properly', function() {
      expect(txdb.transactions).toEqual({});
      expect(txdb.store).toBe(store);
    });
    
    it('fetch a transaction', function() {
      var userData = {};
      var callback = function(transaction, data) {
        expect(transaction).toBe(trans);
        expect(data).toBe(userData);
        expect(txdb.transactions[txHash]).toEqual([trans]);
      };
      txdb.fetchTransaction(txHash, callback, userData);
      // Again to try cache
      txdb.fetchTransaction(txHash, callback, userData);
    });
    
    it('stores a transaction', function() {
      txdb.storeTransaction(txHash, trans);
      expect(txdb.transactions[txHash]).toBeDefined();
      expect(txdb.transactions[txHash]).toEqual([trans]);
      expect(_store[txHash]).toEqual([trans]);
    });
  });
});
