/*
 * @fileOverview HistoryRow model
 */
'use strict';

define(['model/historyrow', 'bitcoinjs-lib'], function(HistoryRow, Bitcoin) {

  describe('HistoryRow model', function() {

    var identity, txObj;

    var transaction = "0100000002d462bfba8c2ce40fd18e91d8eed5e9030b39c26f9cb439ff32bea1ad705d736901\
00000000ffffffff29f3f99a163b84ad25c10d3b3a08e4a862af1a5cfff9ad79d318f040cbc4b0a10000000000ffffffff02\
00e1f505000000001976a9141db621e7447d279d4267f0517e58330d0f89e53d88ac6a600d00000000001976a914c13dbfb6\
c09fd9179e635bcfd95a2b989fc16b1e88ac00000000";

    beforeEach(function() {
      var addresses = {};
      var heights = {};
      txObj = Bitcoin.Transaction.fromHex(transaction);
      identity = {
        txdb: {
          getOutAddresses: function() {
            return ['foo', 'bar'];
          },
          setHeight: function(txHash, val) {
            heights[txHash] = val;
          },
          getHeight: function(txHash) {
            if (heights[txHash]) {
              return heights[txHash];
            }
            return 5400;
          },

          setAddress: function(txHash, val) {
            addresses[txHash] = val;
          },
          getAddress: function(txHash) {
            if (addresses[txHash]) {
              return addresses[txHash];
            }
            if (txHash === 'nolabel' || txHash === 'internal') {
              return false;
            } else {
              return 'destaddress';
            }
          },
          getImpact: function(txId) {
            if (txId === 'nolabel') {
              return {1: {ins: 1000, outs: 0, type: 'multisig'}, 2: {ins: 0, outs: 1000, type: 'hd'}};
            } else if (txId === 'external') {
              return {1: {ins: 1000, outs: 0, type: 'hd'}};
            } else {
              return {1: {ins: 1000, outs: 1000, type: 'multisig'}};
            }
          },
          getLabel: function() {
              return "somelabel";
          },
          getBody: function() {
              return transaction;
          }
        },
        wallet: {
          getWalletAddress: function(address) {
              return {address: address, type: address==='foo'?'stealth':'hd'};
          },
          pockets: {
            getPocket: function(id, type) {return {name: type+id}; }
          }
        }
      };
    });

    it('is created properly', function() {
      var row = new HistoryRow(txObj.getId(), identity);
      expect(row.hash).toBe(txObj.getId());
      expect(row.isStealth).toBe(true);
      expect(row.outAddresses).toEqual([{address: 'foo', type: 'stealth'}, {address: 'bar', type: 'hd'}]);
      expect(row.bareid).toBe("03c1367ed6a87cd69060ff6cdebd33f33a5ca3a5c7d6db92ad7b52e37b3adab8");
      expect(row.label).toBe('somelabel');
      expect(row.impact).toEqual({1: {ins: 1000, outs: 1000, type: 'multisig'}});
      expect(row.myInValue).toEqual(1000);
      expect(row.myOutValue).toEqual(1000);
      expect(row.height).toBe(5400);
    });

    it('is created properly with a tx', function() {
      var row = new HistoryRow(txObj.getId(), identity, txObj);
      expect(row.hash).toBe(txObj.getId());
      expect(row.isStealth).toBe(true);
      expect(row.tx).toBe(txObj);
      expect(row.outAddresses).toEqual([{address: 'foo', type: 'stealth'}, {address: 'bar', type: 'hd'}]);
      expect(row.bareid).toBe("03c1367ed6a87cd69060ff6cdebd33f33a5ca3a5c7d6db92ad7b52e37b3adab8");
      expect(row.label).toBe('somelabel');
      expect(row.impact).toEqual({1: {ins: 1000, outs: 1000, type: 'multisig'}});
      expect(row.myInValue).toEqual(1000);
      expect(row.myOutValue).toEqual(1000);
      expect(row.height).toBe(5400);
    });

    it('gets the destination pocket to pocket label', function() {
      var row = new HistoryRow('nolabel', identity);
      expect(row.address).toBe("multisig1 to hd2");
    });

    it('gets the first outpocket', function() {
      var row = new HistoryRow('nolabel', identity);
      expect(row.outPocket).toBe(2);
    });

    it('gets the first inpocket', function() {
      var row = new HistoryRow('nolabel', identity);
      expect(row.inPocket).toBe('1');
    });
    
    it('gets the destination internal label', function() {
      var row = new HistoryRow('internal', identity);
      expect(row.address).toBe("internal on multisig1");
    });

    it('gets and sets the address', function() {
      var row = new HistoryRow('internal', identity);
      row.address = 'blablabla';
      expect(row.address).toBe("blablabla");
    });

    it('gets internal bool true', function() {
      var row = new HistoryRow('internal', identity);
      expect(row.internal).toBe(true);
    });
    
    it('gets internal bool false', function() {
      var row = new HistoryRow('external', identity);
      expect(row.internal).toBe(false);
    });

    it('gets and sets height', function() {
      var row = new HistoryRow('nolabel', identity);
      row.height = 10000;
      expect(row.height).toBe(10000);
      expect(row.height).toBe(10000);
    });

  });
});
