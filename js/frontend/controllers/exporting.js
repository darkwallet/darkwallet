'use strict';

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {

  // Controller
  controllers.controller('ExportingCtrl', ['$scope', 'notify', 'modals', function($scope, notify, modals) {

  $scope.exportKeys = function() {
      var identity = DarkWallet.getIdentity();
      var allAddresses
      if ($scope.tools.exportAddress) {
          allAddresses = [$scope.tools.exportAddress];
      } else {
          allAddresses = identity.wallet.getPocketAddresses('all');
      }

      modals.password('Unlock password', function(password) {
          try {
	      var output = '';
              for (var i = 0; i < allAddresses.length; i++) {
                  var address = allAddresses[i];
                  var walletAddress = identity.wallet.getWalletAddress(address);
                  // Make sure we only export normal and stealth keys
                  if (walletAddress && [undefined, 'stealth'].indexOf(walletAddress.type) > -1) {
                      identity.wallet.getPrivateKey(walletAddress.index, password, function(privKey) {
                          output += address + ',' + privKey.toWif() + '\n';
                      } );
                  } else if (allAddresses.length == 1) {
                      notify.error("Address not from this wallet");
                      return;
                  }
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
