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

  $scope.newContact = {};
  $scope.createContact = function() {
      $scope.identity.contacts.addContact($scope.newContact.name, $scope.newContact)
  }

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
      /* Load addresses into angular */
      Object.keys(identity.wallet.pubKeys).forEach(function(pubKeyIndex) {
          var splitKey = pubKeyIndex.split(",");
          $scope.generateAddress(parseInt(splitKey[0]));
      });
      /* Initialize if empty wallet */
      if ($scope.addresses.length == 0) {
          // generate 5 addresses for now
          for(var idx=0; idx<5; idx++) {
              $scope.generateAddress();
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
          }, function(addressUpdate) {
              console.log("update", addressUpdate)
          });
      }
      function handleConnect() {
          var client = DarkWallet.obeliskClient.client;
          client.fetch_last_height(heightFetched);
          // get balance for addresses
          $scope.addresses.forEach(function(walletAddress) {
              client.fetch_history(walletAddress.address, function(err, res) { historyFetched(err, walletAddress, res); });
          });
      }
      DarkWallet.obeliskClient.connect('ws://85.25.198.97:8888', handleConnect);
    });
  });

  // scope function to generate (or load from cache) a new address
  $scope.generateAddress = function(isChange) {
    var addressArray = isChange ? $scope.changeAddresses : $scope.addresses;
    var walletAddress = $scope.identity.wallet.getAddress(addressArray.length, isChange);

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

  $scope.section = 'history';
};
