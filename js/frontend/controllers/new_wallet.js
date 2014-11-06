/**
 * @file New Wallet Angular Tricks
 */
'use strict';


/**
 * Password class constructor.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['./module', 'darkwallet', 'mnemonicjs', 'bip39', 'available_languages'], function (controllers, DarkWallet, Mnemonic, BIP39, AvailableLanguages) {
  controllers.controller('NewWalletCtrl', ['$scope', '$location', 'notify', '$translate', '_Filter', function($scope, $location, notify, $translate, _) {

  $scope.step = 1;
  $scope.languages = AvailableLanguages;
  $scope.form = {
    create_or_restore: 'create',
    network: 'bitcoin',
    language: AvailableLanguages.preferedLanguage(),
    seed_type: 'bip39'
  };

  $scope.nextStep = function() {
    $scope.step++;
  };
  
  $scope.previousStep = function() {
    $scope.step--;
  };
  
  $scope.changeLanguage = function() {
    $translate.use($scope.form.language);
  };

  $scope.passwordSubmit = function() {
    // Check that passwords match.
    if ($scope.form.passwd != $scope.form.passwd2) {
      $scope.message = _('Passwords are not the same');
      return;
    }

    if ($scope.form.create_or_restore == 'create') {
      $scope.form.mnemonic = BIP39.generateMnemonic(128);
      $scope.step++;
    } else {
      $scope.step += 2;
    }
  };

  $scope.mnemonicSubmit = function() {
    if ($scope.form.mnemonic && $scope.form.mnemonic != $scope.form.mnemonic2) {
      $scope.message2 = _('Mnemonics are not the same');
      return;
    }
    
    var words = $scope.form.mnemonic2;
    
    var seed;
    if ($scope.form.seed_type == 'bip39') {
      seed = BIP39.mnemonicToSeedHex(words);
    } else {  
      var _words = words.split(' ');
      /* check that it's a valid mnemonic */
      for (var i = 0; i < 12; i++) {
        if (Mnemonic.words.indexOf(_words[i]) == -1) {
            notify.error(_('invalid mnemonic'));
            return;
        }
      }
      var mnemonic = new Mnemonic(_words);
      seed = mnemonic.toHex();
    }

    var walletService = DarkWallet.service.wallet;

    walletService.createIdentity($scope.form.name, $scope.form.network, seed, $scope.form.passwd, function(identity) {
        identity.settings.language = $scope.form.language;
        identity.store.insertPrivateData({mnemonic: words, seed_type: $scope.form.seed_type}, $scope.form.passwd);
        identity.store.save();
        $location.path('#dashboard');
    });
  }
}]);
});
