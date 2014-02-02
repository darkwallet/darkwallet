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

  var keyRing = DarkWallet.keyRing;

  $scope.clearStorage = function() {
      chrome.storage.local.clear();
  }

  DarkWallet.keyRing.loadIdentities(function(names) {
    if (!names) {
       console.log("bad loading");
       return;
    }
    keyRing.get(names[0], function(identity) {
      $scope.identity = identity;
      /* Get 5 addresses */
      $scope.generateAddress();
      $scope.generateAddress();
      $scope.generateAddress();
      $scope.generateAddress();
      $scope.generateAddress();
      $scope.addresses.push({address: '1Evy47MqD82HGx6n1KHkHwBgCwbsbQQT8m', label: 'hackafou'});
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
  $scope.generateAddress = function() {
    var idx = $scope.addresses.length;
    var address = $scope.identity.wallet.getAddress(idx);

    var walletAddress = {
      'label': 'unused',
      'balance': 0,
      'nOutputs': 0,
      'address': address.toString(),
      'raw': address
    };
    // add to scope
    $scope.addresses.push(walletAddress);
  };

  $scope.section = 'history';
};
