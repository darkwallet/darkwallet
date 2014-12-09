/**
 * @file New Wallet Angular Tricks
 */
'use strict';


/**
 * Password class constructor.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['./module', 'darkwallet', 'mnemonicjs', 'available_languages'], function (controllers, DarkWallet, Mnemonic, AvailableLanguages) {
  controllers.controller('NewWalletCtrl', ['$scope', '$location', 'notify', '$translate', '_Filter', function($scope, $location, notify, $translate, _) {

  $scope.step = 1;
  $scope.languages = AvailableLanguages;
  $scope.form = {
    create_or_restore: 'create',
    network: 'bitcoin',
    language: AvailableLanguages.preferedLanguage()
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
      var mnemonic = new Mnemonic(128);
      $scope.form.mnemonic = mnemonic.toWords().join(' ');
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
    
    var words = $scope.form.mnemonic2.split(' ');

    /* check that it's a valid mnemonic */
    for (var i = 0; i < 12; i++) {
        if (Mnemonic.words.indexOf(words[i]) == -1) {
            notify.error(_('invalid mnemonic'));
            return;
        }
    }

    var mnemonic = new Mnemonic(words);

    var walletService = DarkWallet.service.wallet;

    walletService.createIdentity($scope.form.name, $scope.form.network, mnemonic.toHex(), $scope.form.passwd, function(identity) {
        identity.settings.language = $scope.form.language;
        identity.store.save();
        $location.path('#dashboard');
    });
  }
}]);
});
