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
  $scope.utxo = [];

  var keyRing = DarkWallet.keyRing;

  $scope.clearStorage = function() {
      chrome.storage.local.clear();
  }

  keyRing.loadIdentities(function(names) {
    if (!names) {
       console.log("bad loading");
       return;
    }
    keyRing.get(names[0], function(identity) {
      $scope.identity = identity;
      $scope.utxo = [];
      /* Get 5 addresses */
      Object.keys(identity.wallet.pubKeys).forEach(function(pubKeyIndex) {
          var splitKey = pubKeyIndex.split(",");
          $scope.generateAddress(parseInt(splitKey[0]));
      });
      if ($scope.addresses.length == 0) {
          // generate 5 addresses for now
          $scope.generateAddress();
          $scope.generateAddress();
          $scope.generateAddress();
          $scope.generateAddress();
          $scope.generateAddress();
      }
      // testing address:
      // $scope.addresses.push({address: '1Evy47MqD82HGx6n1KHkHwBgCwbsbQQT8m', label: 'hackafou'});
      $scope.$apply();
      function heightFetched(err, height) {
          console.log("height fetched", height);
      }
      function historyFetched(err, walletAddress, history) {
          walletAddress.balance = 0;
          walletAddress.height = 0;
          walletAddress.nOutputs = 0;
          history.forEach(function(tx) {
              // sum unspent outputs for the address
              var outTxHash = tx[0];
              var inTxHash = tx[4];
              walletAddress.nOutputs += 1;
              if (inTxHash == null) {
                  walletAddress.balance += tx[3];
                  if (tx[2] > walletAddress.height) {
                      walletAddress.height = tx[2];
                  }
                  var utxo = {amount: tx[3], index: tx[1], height: tx[2], hash: tx[0], address: walletAddress};
                  $scope.utxo.push(utxo);
              }
          });
          var client = DarkWallet.obeliskClient.client;
          var address = walletAddress.address;
          client.subscribe(walletAddress.address, function(err, res) {
              console.log("subscribed", address, err, res);
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

  // scope function to generate a new address
  $scope.generateAddress = function(isChange) {
    var addressArray = isChange ? $scope.changeAddresses : $scope.addresses;
    var walletAddress = $scope.identity.wallet.getAddress(addressArray.length, isChange);

    // add to scope
    addressArray.push(walletAddress)
    return walletAddress;
  };
  $scope.send = {recipient: '', amount: 0.2, fee: 0.00002};

  function findUtxo(utxoSet, amount) {
      for(var idx=0; idx<utxoSet.length; idx++) {
          if (utxoSet[idx].amount >= amount) {
              return utxoSet[idx];
          }
      }
  }

  $scope.sendBitcoins = function() {
      // get a free change address
      var changeAddress = $scope.generateAddress(1);

      // prepare amounts
      var satoshis = 100000000;
      var amount = $scope.send.amount * satoshis;
      var fee = $scope.send.fee * satoshis;

      // find an output with enough funds
      var utxo = findUtxo($scope.utxo, amount+fee);

      // prepare the transaction
      $scope.identity.wallet.sendBitcoins($scope.send.recipient,
                                          changeAddress,
                                          amount,
                                          fee,
                                          utxo,
                                          $scope.send.password);
  }

  $scope.section = 'history';
};
