/*
 * @fileOverview User oriented history view
 */
'use strict';

define(['model/history'], function(History) {
  describe('History model', function() {
    
    var history, identity, walletAddress;
    var transaction = "0100000001e5ff4507c27f122178533f07eef680bde0218ef8d731bc52fe64a89822ac4e36000000006a473\
044022034f6b4a877c1064bd58653dc102cf1187d4b33e048d1074bdd469bb6af21445b022068532bbbfe7c15251329a5b479a448d03d7\
572d0b79d5a554e87f8096cb2af57012103298323901ec8554099ff7e64e28195f9ae94a2f3487df56b64a7deeabf6428baffffffff027\
a870d000000000017a9140db1635fe975792a9a7b6f2d4061b730478dc6b987484f4000000000001976a9143b70f2aeea554b7fb7d1450\
61efad4398879b9be88ac00000000";    
    var height = 287813;
    var transaction2 = "0100000002d462bfba8c2ce40fd18e91d8eed5e9030b39c26f9cb439ff32bea1ad705d736901\
00000000ffffffff29f3f99a163b84ad25c10d3b3a08e4a862af1a5cfff9ad79d318f040cbc4b0a10000000000ffffffff02\
00e1f505000000001976a9141db621e7447d279d4267f0517e58330d0f89e53d88ac6a600d00000000001976a914c13dbfb6\
c09fd9179e635bcfd95a2b989fc16b1e88ac00000000";

    
    beforeEach(function() {
      identity = {
        store: {
          
        },
        wallet: {
          wallet: {
            outputs: {},
            addresses: []
          }
        },
        txdb: {
          transactions: [],
          fetchTransaction: function(hash, callback, data) {
            var tx = {
              "a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329": transaction,
              "acab6a978681fab0dcbbd0969b2995644ff1b222f793927eb2179e638c4bce38": transaction2
            };
            callback(tx[hash], data);
          }
        }
      };
      history = new History(identity.store, identity);
      history.history = [
        {
          address: "unknown",
          hash: "364eac2298a864fe52bc31d7f88e21e0bd80f6ee073f537821127fc20745ffe5",
          height: 287813,
          inMine: 0, // length of inputs
          myInValue: 0, // amount in satoshis
          myOutValue: 886650, // amount in satoshis
          outMine: 1 // length of ouputs
        }
      ];
      
      walletAddress = {
        "address": "32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc",
        "balance": 709882956,
        "height": 294329,
        "history": [
          ["tx10", 0, 10, 45, null, null, null],
          ["tx20", 0, 20, 85, null, null, null],
          ["tx30", 0, 30, 98, null, null, null],
        ],
        "index": ["32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc", "m"],
        "label": "DarkWallet",
        "nOutputs": 68,
        "type": "multisig"
      };
    });
    
    it('is created properly', function() {
      history = new History(identity.store, identity);
      expect(history.history).toEqual([]);
      expect(history.identity).toBe(identity);
    });
    
    describe('finds index for row', function() { // private
      it('without any unconfirmed transaction', function() {
        history.history = [
          { hash: "tx10", height: 10 },
          { hash: "tx15", height: 15 },
          { hash: "tx20", height: 20 }
        ];
        
        var tx = { hash: "tx14", height: 14 };
        expect(history.addHistoryRow(tx)).toBe(0);

        tx = { hash: "tx9", height: 9 };
        expect(history.addHistoryRow(tx)).toBe(0);

        tx = { hash: "tx15", height: 9 };
        expect(history.addHistoryRow(tx)).toBe(3);

        tx = { hash: "tx21", height: 21 };
        expect(history.addHistoryRow(tx)).toBe(0);
        
        tx = { hash: "txUnconfirmed", height: 0 };
        expect(history.addHistoryRow(tx)).toBe(0);
      });
      
      it('with an unconfirmed transaction', function() {
        history.history = [
          { hash: "tx10", height: 10 },
          { hash: "tx15", height: 15 },
          { hash: "tx20", height: 20 },
          { hash: "txUnconfirmed", height: 0 }
        ];
        
        var tx = { hash: "tx14", height: 14 };
        expect(history.addHistoryRow(tx)).toBe(0);

        tx = { hash: "tx9", height: 9 };
        expect(history.addHistoryRow(tx)).toBe(0);      

        tx = { hash: "tx21", height: 21 };
        expect(history.addHistoryRow(tx)).toBe(0);      

        tx = { hash: "txUnconfirmed", height: 0 };
        expect(history.addHistoryRow(tx)).toBe(2);

        tx = { hash: "txUnconfirmed", height: 294513 };
        expect(history.addHistoryRow(tx)).toBe(1);
      });
    });

    it('adds history row', function() {
      history.history = [
        { hash: "tx10", height: 10 },
        { hash: "tx15", height: 15 },
        { hash: "tx20", height: 20 }
      ];

      var tx = { hash: "tx14", height: 14 };
      history.addHistoryRow(tx);
      expect(history.history.length).toBe(4)
      expect(history.history[3]).toBe(tx);
      
      tx = { hash: "tx9", height: 9 };
      history.addHistoryRow(tx);
      expect(history.history.length).toBe(5);
      expect(history.history[4]).toBe(tx);
      
      tx = { hash: "tx21", height: 21 };
      history.addHistoryRow(tx);
      expect(history.history.length).toBe(6);
      expect(history.history[5]).toBe(tx);
      
      tx = { hash: "txUnconfirmed", height: 0 };
      history.addHistoryRow(tx);
      expect(history.history.length).toBe(7);
      expect(history.history[6]).toBe(tx);
      tx = { hash: "txUnconfirmed", height: 30 };
      history.addHistoryRow(tx);
      expect(history.history.length).toBe(7);
      history.addHistoryRow(tx);
      expect(history.history.length).toBe(7);      
    });

    // TODO: Complete it
    xit('builds history row', function() {
      newRow = history.buildHistoryRow(transaction, height);
      expect(newRow.address).toBe('unknown');
    });
    
    it('fills an input', function() { // private
      var newRow = [];
      history.fillInput(transaction, [0, newRow]);
      expect(newRow.address).toBe('32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc');
      history.fillInput(transaction, [1, newRow]);
      expect(newRow.address).toBe('16RJB5ibPypQR62uXFQP84Zuu1RHUVPdeH');
    });
    
    // TODO: Complete it
    xit('on transaction fetched', function() { // private
      var newRow = history.txFetched(transaction, height);
      expect(newRow).toBeUndefined();
      history.history = [];
      newRow = history.txFetched(transaction, height);
      expect(newRow.address).toBe('32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc');
      expect(newRow.addressIndex).toEqual([ '32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc', 'm' ]);
      expect(newRow.inPocket).toBe('32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc');
    });

    // TODO: Compelte it
    xit('fills history', function() {
      history.history = [];
      var historyRows = [
        ["acab6a978681fab0dcbbd0969b2995644ff1b222f793927eb2179e638c4bce38", 0, 287813, 886650, null, null, null]
      ];
      history.fillHistory(historyRows);
      expect(history.history.length).toBe(1);
      expect(history.history[0].hash).toEqual('d21633ba23f70118185227be58a63527675641ad37967e2aa461559f577aec43');
    });

    // it('updates');
  });
});
