
/**
 * @file New Wallet Angular Tricks
 */


/**
 * Password class constructor.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
function NewWalletCtrl($scope) {

  $scope.passwordHidden = '';
  $scope.mnemonicHidden = 'hidden';
  $scope.mnemonic2Hidden = 'hidden';

  $scope.passwordSubmit = function() {
    var passwd = $scope.passwd;

    // Check that passwords match.
    if ($scope.passwd != $scope.passwd2) {
      $scope.message = 'Passwords are not the same';
      $scope.pubKey = '';
      $scope.privKey = '';
      return;
    }
    
    var mnemonic = new Mnemonic(128);

    $scope.passwordHidden = "hidden";
    $scope.mnemonicHidden = "";

    $scope.mnemonicWords = mnemonic.toWords().join(' ');
  };
  
  $scope.mnemonicSubmit = function() {
    $scope.mnemonicHidden = "hidden";
    $scope.mnemonic2Hidden = "";
  };

  $scope.mnemonic2Submit = function() {
    if ($scope.mnemonicWords != $scope.mnemonic2Words) {
      alert("ey!");
      return;
    }
    
    var words = $scope.mnemonic2Words.split(' ');
    var mnemonic = new Mnemonic(words);
    alert(mnemonic.toHex());
  };
};

