/**
 * @fileOverview Wallet classes.
 */

// TODO: Namespace these.
var password = prompt('Password');
var prev_err = false;


/**
 * Database callback function.
 * @param {Function} err Callback function.
 */
function onLoad(err) {
  if (!prev_err && err) {
    prev_err = true;
    alert('Invalid password');
    window.close();
  }
}


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
  var identity = keyRing.get(keyRing.getIdentityNames()[0]);

  // scope function to generate a new address
  $scope.generateAddress = function() {
    var idx = $scope.addresses.length;

    // BIP32 js support is still missing some part and we can't get addresses
    // from pubkey yet, unless we do it custom like here...:
    // (mpKey.key.getBitcoinAddress doesn't work since 'key' is not a key
    // object but binary representation).
    var childKey = mpKey.ckd(idx);
    var mpKeyHash = Bitcoin.Util.sha256ripe160(childKey.key);
    var address = new Bitcoin.Address(mpKeyHash);
    console.log(address.toString())

    var walletAddress = {
      'label': 'unused',
      'address': address.toString(),
      'raw': address
    };
    // add to scope
    $scope.addresses.push(walletAddress);
  };

  // Get public key from local storage.
  chrome.storage.local.get('pubKey', function(pubKey) {

    // Save it in ng scope so we can access it easily for now.
    $scope.masterPublicKey = pubKey.pubKey;

    // Save on local scope.
    pubKey = pubKey.pubKey;
    mpKey = new Bitcoin.BIP32key(pubKey);

    // Generate some addresses for testing.
    $scope.generateAddress();
    $scope.generateAddress();
    $scope.generateAddress();
    $scope.generateAddress();
    $scope.generateAddress();

    // Apply scope since we're not in an angular callback.
    $scope.$apply();
  });

  $scope.section = 'history';
};
