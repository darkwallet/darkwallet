/**
 * @fileOverview Wallet classes.
 */

/**
 * Wallet constructor class.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
function WalletCtrl($scope) {
  var pubKey, mpKey, addressIndex;

  // generated addresses
  $scope.addresses = [];
  $scope.changeAddresses = [];
  $scope.subsection = 'history';

  var keyRing = DarkWallet.keyRing;

  $scope.clearStorage = function() {
      keyRing.clear();
  }
  keyRing.loadIdentities(function(names) {
    if (!names) {
       console.log("bad loading");
       return;
    }
    keyRing.get(names[0], function(identity) {
      $scope.identity = identity;
      $scope.history = identity.history.history;
      // set history update callback
      identity.history.update = function() { $scope.$apply(); }
      $scope.totalBalance = $scope.identity.wallet.getBalance();
      /* Load addresses into angular */
      Object.keys(identity.wallet.pubKeys).forEach(function(pubKeyIndex) {
          var splitKey = pubKeyIndex.split(",");
          // Regular addresses
          if (splitKey.length >= 2) {
              var walletAddress = $scope.identity.wallet.getAddress(pubKeyIndex);

              // add to scope
              var addressArray = parseInt(splitKey[0]) ? $scope.changeAddresses : $scope.addresses;
              addressArray.push(walletAddress)
          }
      });
      /* Initialize if empty wallet */
      if ($scope.addresses.length == 0) {
          // generate 5 addresses for now
          for(var idx=0; idx<5; idx++) {
              $scope.generateAddress(0);
          }
      }

      // apply scope
      $scope.$apply();

      function heightFetched(err, height) {
          console.log("height fetched", height);
      }
      function historyFetched(err, walletAddress, history) {
          var client = DarkWallet.obeliskClient.client;

          // pass to the wallet to process outputs
          $scope.identity.wallet.processHistory(walletAddress.address, history);

          // now subscribe the address for notifications
          client.subscribe(walletAddress.address, function(err, res) {
              console.log("subscribed", walletAddress.address, err, res);
              // fill history after subscribing to ensure we got all histories already (for now).
              $scope.identity.history.fillHistory(history);
          }, function(addressUpdate) {
              console.log("update", addressUpdate)
          });
          $scope.totalBalance = $scope.identity.wallet.getBalance();
          $scope.$apply();
      }
      function handleConnect() {
          var client = DarkWallet.obeliskClient.client;
          client.fetch_last_height(heightFetched);
          // get balance for addresses
          $scope.addresses.forEach(function(walletAddress) {
              if (walletAddress.history) {
                  $scope.identity.history.fillHistory(walletAddress.history)
              }
              client.fetch_history(walletAddress.address, function(err, res) { historyFetched(err, walletAddress, res); });
          });
          $scope.changeAddresses.forEach(function(walletAddress) {
              if (walletAddress.history) {
                  $scope.identity.history.fillHistory(walletAddress.history)
              }
              client.fetch_history(walletAddress.address, function(err, res) { historyFetched(err, walletAddress, res); });
          });
      }
      DarkWallet.obeliskClient.connect('ws://85.25.198.97:8888', handleConnect);
    });
  });

  // scope function to generate (or load from cache) a new address
  $scope.generateAddress = function(isChange, n) {
    var addressArray = isChange ? $scope.changeAddresses : $scope.addresses;
    if (n === undefined || n === null) {
        n = addressArray.length;
    }
    var walletAddress = $scope.identity.wallet.getAddress([isChange, n]);

    // add to scope
    addressArray.push(walletAddress)
    return walletAddress;
  };
  $scope.send = {recipient: '', amount: 0.2, fee: 0.00002};

  $scope.sendBitcoins = function() {
      // get a free change address
      var changeAddress = $scope.generateAddress(1);

      // prepare amounts
      var satoshis = 100000000;
      var amount = $scope.send.amount * satoshis;
      var fee = $scope.send.fee * satoshis;

      // prepare the transaction
      $scope.identity.wallet.sendBitcoins($scope.send.recipient,
                                          changeAddress,
                                          amount,
                                          fee,
                                          $scope.send.password);
  }

  $scope.receiveStealth = function() {
      var client = DarkWallet.obeliskClient.client;
      var stealth_fetched = function(error, results) {
          if (error) {
              write_to_screen('<span style="color: red;">ERROR:</span> ' + error);
              return;
          }
          console.log("STEALTH", results);
          $scope.identity.wallet.processStealth(results, $scope.send.password);
      }
      client.fetch_stealth([0,0], stealth_fetched, 0);
  }
  $scope.section = 'history';
};
