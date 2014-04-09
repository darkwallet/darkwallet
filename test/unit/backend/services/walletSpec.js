/*
 * @fileOverview Background service running for the wallet
 */
define(['backend/services/wallet'], function(WalletService) {
  'use strict';
    
   xit('broadcasts transactions', function() {
      var tx = {};
      tx.serializeHex = function() { return "newTx"; };
      // TODO: initialize properly
      var walletService = WalletService();
      walletService.broadcastTx(tx, false, function(err, data) {
        expect(err).toBeFalsy();
        expect(data.radar).toBeDefined();
      });
      
      tx.serializeHex = function() { return "newTxError"; };
      
      walletService.broadcastTx(tx, false, function(err, data) {
        expect(err).toBeTruthy();
      });
   });
 
});

