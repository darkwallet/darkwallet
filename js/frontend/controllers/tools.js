'use strict';

define(['./module', 'darkwallet', 'bitcoinjs-lib'], function (controllers, DarkWallet, Bitcoin) {

  // Controller
  controllers.controller('ToolsCtrl', ['$scope', 'notify', function($scope, notify) {

  $scope.tools = {status: 'OK'};

  var finishClearStorage = function() {
      var keyRing = DarkWallet.getKeyRing();
      keyRing.clear();
      notify.note('Storage cleared, please restart your browser.');
  }


  // Clear the local storage
  $scope.clearStorage = function() {
      $scope.openModal('confirm-delete', {name: 'Your WHOLE storage', object: {}}, finishClearStorage)
  };
  
  // Clear all tasks
  $scope.clearTasks = function() {
      var identity = DarkWallet.getIdentity();
      identity.tasks.clear();
      notify.note('Tasks cleared.');
  };


  /**
   * Verify a signature
   */
  $scope.verifyText = function() {
      var address = $scope.tools.verifyAddress;
      var sigHex = $scope.tools.verifySig;
      var text = $scope.tools.verifyText;

      var sig = Bitcoin.convert.hexToBytes(sigHex);
      var res = Bitcoin.Message.verify(address, sig, text);
      if (res) {
          $scope.tools.status = 'signature ok';
      } else {
          $scope.tools.status = 'invalid signature';
      }
      $scope.verifyOpen = false;
      $scope.tools.open = false;
  }


  /**
   * Sign and verify the given text
   */
  var signText = function(privKey, address, text) {
      var sig = Bitcoin.Message.sign(privKey, text);

      var res = Bitcoin.Message.verify(address, sig, text);

      var sigHex = Bitcoin.convert.bytesToHex(sig);

      return sigHex;
  }


  /**
   * Sign the given text
   */
  $scope.signText = function() {
      var text = $scope.tools.signText;
      var address = $scope.tools.signAddress;
      var identity = DarkWallet.getIdentity();
      var walletAddress = identity.wallet.getWalletAddress(address);
      if (!walletAddress) {
          notify.warning("Incorrect address for this wallet");
      } else {
          $scope.openModal('ask-password', {text: 'Unlock password', password: ''}, function(password) {
              try {
                  identity.wallet.getPrivateKey(walletAddress.index, password, function(privKey) {
                      $scope.tools.status = signText(privKey, walletAddress.address, text);
                      $scope.signOpen = false;
                      $scope.tools.open = false;
                      notify.success("Signed");
                  });
              } catch (e) {
                  notify.error('Incorrect password', e.message);
              }
          } );
      }
  } 

}]);
});
