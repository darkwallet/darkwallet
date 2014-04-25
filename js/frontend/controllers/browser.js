'use strict';

define(['./module', 'darkwallet', 'frontend/port', 'bitcoinjs-lib', 'util/btc'], function (controllers, DarkWallet, Port, Bitcoin, BtcUtils) {

  // Controller
  controllers.controller('BrowserCtrl', ['$scope', 'modals', 'notify', '$routeParams', '$location', function($scope, modals, notify, $routeParams, $location) {

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
      var result, notes;
      var identity = DarkWallet.getIdentity();
      var pubKeys = anIn.script.extractPubkeys();
      var lastScriptByte = anIn.script.buffer[anIn.script.buffer.length-1];
      if (pubKeys.length == 1) {
          // pubkey hash
          var pubKeyBytes = pubKeys[0];
          var pubKey = new Bitcoin.ECPubKey(pubKeys[0], pubKeyBytes.length==33);
          var address = pubKey.getAddress(identity.wallet.versions.address);
          result = address.toString();
      } else if (anIn.script.chunks[0] == 0 && lastScriptByte == Bitcoin.Opcode.map.OP_CHECKMULTISIG) {
          // multisig
          var multisig = BtcUtils.importMultiSig(Bitcoin.convert.bytesToHex(anIn.script.chunks[anIn.script.chunks.length-1]));
          result = multisig.address;
          notes = (anIn.script.chunks.length-2) + "/" + multisig.pubKeys.length + " sigs"
      } else if (anIn.outpoint.hash == '0000000000000000000000000000000000000000000000000000000000000000') {
          result = '';
          notes = "coinbase";
      } else {
          console.log('unknown', anIn);
      }
      return {address: result, notes: notes};
  };

  /**
   * Process a transaction to extract some info
   */
  var processTransaction = function(tx) {
      tx = BtcUtils.fixTxVersions(tx, DarkWallet.getIdentity());
      tx.ins.forEach(function(anIn, i) {
          var pubKeys = anIn.script.extractPubkeys();
          anIn.address = $scope.showInput(anIn);
        
      })
  };

  /**
   * Transaction received callback
   */
  var onFetchTransaction = function(err, data) {
      if (err) {
          notify.warning("Transaction not found", err.message);
          return;
      } else {
          $scope.txName = $scope.txHash;
          $scope.tx = new Bitcoin.Transaction(data);
          $scope.address = '';
          $scope.history = '';
          processTransaction($scope.tx);
      }
      $scope.$apply();
  };

  /**
   * Direct search for a transaction
   */
  $scope.searchTransaction = function(txHash) {
      var client = DarkWallet.getClient();
      client.fetch_transaction(txHash||$scope.txHash, onFetchTransaction);
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
      if (err) {
          notify.warning("Address not found!", err.message);
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
      $scope.$apply();
  };


  /**
   * Direct address search
   */
  $scope.searchAddress = function(address) {
      var client = DarkWallet.getClient();
      $scope.address = address;
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
   * Open a link. Currently searches but could go to some url
   */
  $scope.openLink = function(data) {
      $scope.search(data);
  }

  $scope.range = function(n) {
      if (!n) return [];
      return new Array(n);
  };

  /**
   * Handle route parameters so we can receive url like #browser/<search>
   */
  if ($routeParams.search) {
      $scope.txHash = $routeParams.search;
      $scope.searchReally($routeParams.search);
  }

}]);
});
