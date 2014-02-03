/**
 * @fileOverview Wallet classes.
 */

// TODO: Namespace these.
/*var password = prompt('Password');
var prev_err = false;
*/

/**
 * Database callback function.
 * @param {Function} err Callback function.
 */
/*
function onLoad(err) {
  if (!prev_err && err) {
    prev_err = true;
    alert('Invalid password');
    window.close();
  }
}
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
          $scope.generateAddress(parseInt(pubKeyIndex.split(",")[0]));
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
    var idx;
    if (isChange) {
        idx  = $scope.changeAddresses.length;
    } else {
        idx  = $scope.addresses.length;
    }
    var address = $scope.identity.wallet.getAddress(idx, isChange);

    var walletAddress = {
      'index': [isChange, idx],
      'label': 'unused',
      'balance': 0,
      'nOutputs': 0,
      'address': address.toString(),
      'raw': address
    };
    // add to scope
    if (isChange) {
        $scope.changeAddresses.push(walletAddress);
    } else {
        $scope.addresses.push(walletAddress);
    }
    return walletAddress;
  };
  $scope.send = {recipient: '', amount: 0.2, fee: 0.00002};

  function findUtxo(amount) {
      for(var idx=0; idx<$scope.utxo.length; idx++) {
          console.log($scope.utxo[idx].amount, amount);
          if ($scope.utxo[idx].amount >= amount) {
              return $scope.utxo[idx];
          }
      }
  }

  $scope.sendBitcoins = function() {
      var changeAddress = $scope.generateAddress(1);
      var amount = $scope.send.amount*100000000;
      var fee = $scope.send.fee * 100000000;

      // now prepare transaction
      var newTx = new Bitcoin.Transaction();

      // need to select unspent outputs with enough funds...
      var utxo = findUtxo(amount+fee);
      var txHash = utxo.hash;
      var outIndex = utxo.index;
      var outAmount = utxo.amount;
      var outAddress = utxo.address;

      // add inputs
      newTx.addInput(txHash, outIndex);
      var change = outAmount - (amount + fee);

      // add outputs
      newTx.addOutput($scope.send.recipient, amount);
      newTx.addOutput(changeAddress.address, change);

      console.log("sending: change", change, "sending", amount+fee, "utxo", utxo.amount);

      // might need to sign several inputs
      var pocket, n;
      if (utxo.address.index) {
          pocket = utxo.address.index[0];
          n = utxo.address.index[1];
      } else {
          // XXX testing only
          pocket = 0;
          n = 0;
      }
      // XXX should catch exception on bad password:
      //   sjcl.exception.corrupt {toString: function, message: "ccm: tag doesn't match"}
      $scope.identity.wallet.getPrivateKey(n, pocket, $scope.send.password, function(outKey) {
          newTx.sign(0, outKey.key);

          // XXX send transaction
          console.log($scope.send.recipient, $scope.send.amount, $scope.send.fee, newTx);
      });
  }

  $scope.section = 'history';
};
