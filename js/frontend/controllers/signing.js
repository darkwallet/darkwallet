'use strict';

define(['./module', 'darkwallet', 'bitcoinjs-lib', 'util/stealth'], function (controllers, DarkWallet, Bitcoin, Stealth) {

  // Controller
  controllers.controller('SigningCtrl', ['$scope', 'notify', 'modals', '_Filter', function($scope, notify, modals, _) {

  /**
   * Message formatting
   */

  var SIGHEADER = '-----BEGIN BITCOIN SIGNED MESSAGE-----\n';
  var SIGINIT = '\n-----BEGIN BITCOIN SIGNATURE-----\n';
  var SIGEND = '\n-----END BITCOIN SIGNATURE-----';

  var parseText = function(text) {
      var initHead = text.indexOf(SIGHEADER);

      if (initHead == -1) {
          throw Error('Not a bitcoin signed message');
      }
      var message = text.substring(initHead);
      var initText = message.indexOf('\n\n');
      var initSigHead = message.indexOf(SIGINIT);
      if (initSigHead == -1) {
          throw Error('Message is incomplete');
      }
      var initSig = message.substring(initSigHead).indexOf('\n\n');
      var endSig = message.indexOf(SIGEND);

      if (endSig == -1) {
          throw Error('Message is incomplete');
      }
      var initAddress = message.indexOf('Address: ');
      var endAddress = message.substring(initAddress).indexOf('\n');
      var address = message.substring(initAddress+9, initAddress+endAddress);

      var resText = message.substring(initText+2, initSigHead);
      var resSig = message.substring(initSigHead+initSig+2, endSig);

      var sigBase64 = resSig.split('\n').join('');

      return {text: resText, signature: sigBase64, address: address};
  }

  /**
   * Format text address and signatures as one message
   */
  var formatText = function(text, address, signature) {
      var formatted = SIGHEADER;
      formatted += 'Address: '+address+'\n';
      formatted += 'Hash: SHA256\n\n';
      formatted += text;
      formatted += SIGINIT;
      formatted += 'Version: GnuPG v1.4.12 (GNU/Linux)\n\n';
      var i = 0;
      while(i*64 < signature.length) {
          formatted += signature.substr(i*64, (i+1)*64)+'\n';
          i += 1;
      }
      formatted += SIGEND;
      return formatted;
  };


  /**
   * Verify a signature
   */

  $scope.verifyText = function() {
      var address = $scope.tools.verifyAddress;
      var sigText = $scope.tools.verifySig;
      var text = $scope.tools.verifyText;

      if (!sigText) {
          var parsed;
          try {
              parsed = parseText(text);
          } catch(e) {
              notify.error(_('Error decoding'), e.message);
              return;
          }
          sigText = parsed.signature;
          if (!address) {
              address = parsed.address;
          }
          text = parsed.text;
      }
      if (!sigText || !address) {
          notify.error(_('Could not find address or signature'));
          return;
      }
      var sig = Bitcoin.convert.base64ToBytes(sigText);
      var res = Bitcoin.Message.verify(address, sig, text);
      if (res) {
          $scope.tools.status = 'signature ok by ' + address;
          notify.success(_('Signature ok'));
      } else {
          $scope.tools.status = 'invalid signature';
          notify.warning(_('Invalid signature'));
      }
      $scope.tools.output = '';
      $scope.verifyOpen = false;
      $scope.tools.open = false;
  }


  /**
   * Sign and verify the given text
   */
  var signText = function(privKey, address, text) {
      var sig = Bitcoin.Message.sign(privKey, text);

      var res = Bitcoin.Message.verify(address, sig, text);

      var sigText = Bitcoin.convert.bytesToBase64(sig);

      return sigText;
  };

  /**
   * Sign the given text
   */
  $scope.signText = function() {
      var text = $scope.tools.signText;
      var address = $scope.tools.signAddress;
      var identity = DarkWallet.getIdentity();
      var walletAddress = identity.wallet.getWalletAddress(address);
      if (!walletAddress) {
          notify.warning(_('Incorrect address for this wallet'));
      } else if (walletAddress.type == 'readonly' || walletAddress.type == 'multisig') {
          notify.warning(_('Can\'t sign with readonly or multisig addresses'));
      } else {
          modals.password('Unlock password', function(password) {
              try {
                  // Stealth backwards comp workaround, 0.4.0
                  Stealth.quirk = walletAddress.quirk;
                  identity.wallet.getPrivateKey(walletAddress, password, function(privKey) {
                      var signature = signText(privKey, walletAddress.address, text);
                      $scope.tools.output = formatText(text, address, signature);
                      $scope.tools.status = 'ok';
                      $scope.tools.signOpen = false;
                      $scope.tools.open = false;
                      notify.success(_('Signed'));
                  });
                  Stealth.quirk = false;
              } catch (e) {
                  Stealth.quirk = false;
                  notify.error(_('Incorrect password'), e.message);
              }
          } );
      }
  } 

}]);
});
