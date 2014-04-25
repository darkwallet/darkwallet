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
      var result;
      var identity = DarkWallet.getIdentity();
      var pubKeys = anIn.script.extractPubkeys();
      if (pubKeys.length == 1) {
          var pubKeyBytes = pubKeys[0];
          var pubKey = new Bitcoin.ECPubKey(pubKeys[0], pubKeyBytes.length==33);
          var address = pubKey.getAddress(identity.wallet.versions.address);
          result = address.toString()
      } else {
          result = "Unknown " + pubKeys.length + " pubkeys";
      }
      return result;
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
      $scope.history = $scope.allHistory.slice(page*10, (page*limit)+limit)
  }

  /**
   * History received callback
   */
  $scope.page = 0;
  var limit = 50;
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
          var confirmed = 0;
          var unconfirmed = 0;
          history.forEach(function(row) {
              var value = row[3];
              if (row[4]) { // spend tx
                   if (!row[6]) // spend height
                       unconfirmed-=value;
              }
              else if (row[2]) {
                  confirmed += value;
              } else {
                  unconfirmed += value;
              }
          });
          $scope.balance = {confirmed: confirmed, unconfirmed: unconfirmed};
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
