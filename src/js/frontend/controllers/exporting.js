'use strict';

define(['./module', 'darkwallet', 'bitcoinjs-lib'], function (controllers, DarkWallet, Bitcoin) {

  // Controller
  controllers.controller('ExportingCtrl', ['$scope', 'notify', 'modals', '_Filter', function($scope, notify, modals, _) {

  $scope.exportKeys = function() {
      var identity = DarkWallet.getIdentity();
      var allAddresses;
      if ($scope.tools.exportAddresses) {
          allAddresses = $scope.tools.exportAddresses.split('\n');
      } else {
          allAddresses = identity.wallet.getPocketAddresses('all');
      }

      modals.password(_('Write your password'), function(password) {
          try {
	      var output = '';
              for (var i = 0; i < allAddresses.length; i++) {
                  var address = allAddresses[i];
                  var walletAddress = identity.wallet.getWalletAddress(address);
                  // Make sure we only export normal and stealth keys
                  if (walletAddress && [undefined, 'hd', 'oldstealth', 'stealth'].indexOf(walletAddress.type) > -1) {
                      identity.wallet.getPrivateKey(walletAddress, password, function(privKey) {
                          output += address + ',' + privKey.toWIF(Bitcoin.networks[identity.wallet.network]) + '\n';
                      } );
                  } else if (allAddresses.length == 1) {
                      notify.error(_('Address not from this wallet'));
                  }
              }

              $scope.tools.exportAddresses = output;
              $scope.tools.status = 'ok';

              notify.success(_('Exported'));
          } catch (e) {
              notify.error(_('Incorrect password'), _(e.message));
          }
      } );
  }


}]);
});
