
/**
 * @file New Wallet Angular Tricks
 */


/**
 * Password class constructor.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
function NewWalletCtrl($scope, $location) {

  $scope.activeForm = 'password';
  $scope.create_or_restore = 'create';

  $scope.passwordSubmit = function() {
    var passwd = $scope.passwd;

    // Check that passwords match.
    if ($scope.passwd != $scope.passwd2) {
      $scope.message = 'Passwords are not the same';
      $scope.pubKey = '';
      $scope.privKey = '';
      return;
    }

    if ($scope.create_or_restore == 'create') {
      var mnemonic = new Mnemonic(128);
      $scope.mnemonicWords = mnemonic.toWords().join(' ');
      $scope.activeForm = 'mnemonic';
    } else {
      $scope.activeForm = 'mnemonic2';
    }
  };
  
  $scope.mnemonicSubmit = function() {
    $scope.activeForm = 'mnemonic2';
  };

  $scope.mnemonic2Submit = function() {
    if ($scope.mnemonicWords && $scope.mnemonicWords != $scope.mnemonic2Words) {
      alert("ey!");
      return;
    }
    
    var words = $scope.mnemonic2Words.split(' ');
    var mnemonic = new Mnemonic(words);
    DarkWallet.getKeyRing().createIdentity($scope.name, mnemonic.toHex(), $scope.passwd);
    window.location = 'wallet.html'
  }
};
