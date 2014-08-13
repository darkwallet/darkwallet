'use strict';

// TODO: remove stealth?
define(['./module', 'darkwallet', 'bitcoinjs-lib', 'util/stealth'], function (controllers, DarkWallet, Bitcoin, Stealth) {

  // Controller
  controllers.controller('ExportingCtrl', ['$scope', 'notify', 'modals', function($scope, notify, modals) {

  // Get text from textbox, return list of addresses to export
  var parseAddressList = function(addressList) {
    // TODO
  }

  $scope.exportKeys = function() {
      var identity = DarkWallet.getIdentity();
      var allAddresses = identity.wallet.getPocketAddresses('all');

      modals.password('Unlock password', function(password) {
          try {
	      var output = '';
              for (var i = 0; i < allAddresses.length; i++) {
                  var address = allAddresses[i];
                  var walletAddress = identity.wallet.getWalletAddress(address);
                  identity.wallet.getPrivateKey(walletAddress.index, password, function(privKey) {
                      output += address + ',' + privKey + '\n';
                  } );
              }
              $scope.tools.output = output;
              $scope.tools.status = 'ok';
              $scope.tools.exportOpen = false;
              $scope.tools.open = false;
              notify.success("Exported");
          } catch (e) {
              notify.error('Incorrect password', e.message);
          }
      } );
  }


}]);
});
