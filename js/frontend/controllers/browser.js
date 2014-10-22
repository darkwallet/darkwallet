'use strict';

define(['./module', 'darkwallet', 'frontend/port', 'bitcoinjs-lib', 'util/btc'], function (controllers, DarkWallet, Port, Bitcoin, BtcUtils) {

  // Controller
  controllers.controller('BrowserCtrl', ['$scope', 'modals', 'notify', '$routeParams', '$location', '_Filter', function($scope, modals, notify, $routeParams, $location, _) {

  $scope.bytesToHex = Bitcoin.convert.bytesToHex;


  /*********************************
   * Transactions
   */

  $scope.txHash = '';
  $scope.transaction = '';


  /**
   * Show an input (extracts the address sending)
   */
  $scope.showInput = function(anIn) {
      var identity = DarkWallet.getIdentity();

      var address = BtcUtils.getInputAddress(anIn, identity.wallet.versions);

      var lastScriptByte = anIn.script.buffer[anIn.script.buffer.length-1];
      var notes;

      if (anIn.script.chunks[0] == 0 && lastScriptByte == Bitcoin.opcodes.OP_CHECKMULTISIG) {
          // multisig
          var fundScript = $scope.bytesToHex(anIn.script.chunks[anIn.script.chunks.length-1]);
          var multisig = BtcUtils.importMultiSig(fundScript);
          notes = (anIn.script.chunks.length-2) + "/" + multisig.pubKeys.length + " sigs"
      } else if (anIn.hash.toString('hex') == '0000000000000000000000000000000000000000000000000000000000000000') {
          result = '';
          notes = "coinbase";
      } else {
          notes = '';
      }
      return {address: address, notes: notes};
  };

  /**
   * Process a transaction to extract some info
   */
  var processTransaction = function(tx) {
      var identity = DarkWallet.getIdentity();
      tx.ins.forEach(function(anIn, i) {
          anIn.address = $scope.showInput(anIn);
          anIn.outpoint = {hash: Bitcoin.bufferutils.reverse(anIn.hash).toString('hex'), index: anIn.index};
        
      })
      tx.outs.forEach(function(anOut, i) {
          try {
              anOut.address = Bitcoin.Address.fromOutputScript(anOut.script, Bitcoin.networks[identity.wallet.network]);
          } catch (e) {
              if (anOut.script.chunks[0] == Bitcoin.opcodes.OP_RETURN) {
                  var nonceVersion = anOut.script.chunks[1][0];
                  if (nonceVersion == identity.wallet.versions.stealth.nonce) {
                      anOut.notes = 'stealth';
                  } else {
                      anOut.notes = 'data';
                  }
                  anOut.address = anOut.script.chunks[1].toString('hex').slice(0, 32)+"...";
              } else {
                  console.log("cannot decode", e);
                  anOut.address = '';
              }
          }
        
      })
  };

  /**
   * Transaction received callback
   */
  var onFetchTransaction = function(err, data) {
      $scope.fetching = false;
      if (err) {
          notify.warning(_('Transaction not found'), err.message);
          return;
      } else {
          $scope.txName = $scope.txHash;
          $scope.tx = Bitcoin.Transaction.fromHex(data);
          $scope.address = '';
          $scope.history = '';
          processTransaction($scope.tx);
      }
      if (!$scope.$$phase) {
          $scope.$apply();
      }
  };

  /**
   * Direct search for a transaction
   */
  $scope.searchTransaction = function(txHash) {
      var client = DarkWallet.getClient();
      $scope.fetching = true;
      var tx = DarkWallet.getIdentity().txdb.getBody(txHash);
      if (tx) {
          onFetchTransaction(false, tx);
      } else if (client) {
          client.fetch_transaction(txHash, onFetchTransaction);
      }
  }


  /*********************************
   * Addresses
   */

  $scope.filterHistoryRows = function(page) {
      $scope.page=page;
      $scope.history = $scope.allHistory.slice(page*limit, (page*limit)+limit)
  }

  /**
   * History received callback
   */
  $scope.page = 0;
  var limit = 25;
  var onFetchHistory = function(err, history) {
      $scope.fetching = false;
      if (err) {
          notify.warning(_('Address not found!'), err.message);
          return;
      } else {
          $scope.txName = '';
          $scope.tx = false;
          $scope.allHistory = history;
          $scope.nPages = Math.ceil(history.length / limit);
          $scope.filterHistoryRows(0);
          var inConfirmed = 0;
          var inUnconfirmed = 0;
          var outConfirmed = 0;
          var outUnconfirmed = 0;
          history.forEach(function(row) {
              var value = row[3];
              // Check spend
              if (row[4]) {
                   if (!row[6]) { // spend height
                       outUnconfirmed+=value;
                   } else {
                       outConfirmed+=value;
                   }
              }
              // Check input
              if (row[2]) { // our height
                  inConfirmed+=value;
              } else {
                  inUnconfirmed+=value;
              }
          });
          $scope.balance = {confirmed: inConfirmed-outConfirmed, unconfirmed: inUnconfirmed-outUnconfirmed};
          $scope.balanceIn = {confirmed: inConfirmed, unconfirmed: inUnconfirmed};
          $scope.balanceOut = {confirmed: outConfirmed, unconfirmed: outUnconfirmed};
      }
      if (!$scope.$$phase) {
          $scope.$apply();
      }
  };


  /**
   * Direct address search
   */
  $scope.searchAddress = function(address) {
      var client = DarkWallet.getClient();
      $scope.address = address;
      $scope.fetching = true;
      client.fetch_history(address, 0, onFetchHistory);
  }


  /**
   * General search... search anything!
   */
  $scope.search = function(data) {
      data = data || $scope.txHash;
      $location.path('/browser/'+data);
  }

  $scope.searchReally = function(data) {
      data = data || $scope.txHash;
      if (data.length < 40) {
          $scope.searchAddress(data);
      } else {
          $scope.searchTransaction(data);
      }
  }

  /**
   * Handle route parameters so we can receive url like #browser/<search>
   */
  if ($routeParams.search) {
      $scope.txHash = $routeParams.search;
      $scope.searchReally($routeParams.search);
  }

}]);

});
