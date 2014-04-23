/**
 * @fileOverview AddressesCtrl angular controller
 */
'use strict';

define(['./module', 'bitcoinjs-lib', 'darkwallet'],
function (controllers, Bitcoin, DarkWallet) {
  controllers.controller('AddressesCtrl', ['$scope', '$history', function($scope, $history) {

  // Filters
  $scope.addrFilter = $history.addrFilter;

  /**
   * Address filter
   */
  $scope.setAddressFilter = function(name) {
      $scope.addrFilter = name;
      $scope.historyRows = $history.setAddressFilter(name);
  };

  $scope.addressFilter = function(row) {
      return $history.addressFilter(row);
  };

  /**
   * Utility scope functions
   */
  $scope.copyClipboardPublic = function(walletAddress) {
      var pubKey = new Bitcoin.ECPubKey(walletAddress.pubKey, true);
      var publicHex = pubKey.toHex();
      $scope.copyClipboard(publicHex, 'Copied public key to clipboard');
  }

  $scope.saveStore = function() {
      var identity = DarkWallet.getIdentity();
      identity.store.save();
  }

}]);
});
