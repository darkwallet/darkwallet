/**
 * @fileOverview AddressesCtrl angular controller
 */
'use strict';

define(['./module', 'bitcoinjs-lib', 'darkwallet'],
function (controllers, Bitcoin, DarkWallet) {
  controllers.controller('AddressesCtrl', ['$scope', '$history', '$wallet', 'clipboard', function($scope, $history, $wallet, clipboard) {

  // Filters
  $scope.addrFilter = $history.addrFilter;

  /**
   * Generate an address
   * @param {Integer} branchId
   * @param {Integer} n
   * @return {Object} Wallet address struct
   */
  $scope.generateAddress = function(branchId, n) {
      return $wallet.generateAddress(branchId, n);
  };

  /**
   * Sets an address filter
   * @param {String} name Filter name
   */
  $scope.setAddressFilter = function(name) {
      $scope.addrFilter = name;
      $scope.historyRows = $history.setAddressFilter(name);
  };

  /**
   * Scope Binding for address filter
   * @param {Object} row Row to apply the filter
   * @return {Boolean} Passes or not the filter
   */
  $scope.addressFilter = function(row) {
      return $history.addressFilter(row);
  };

  /**
   * Copies to clipboard a wallet address public key
   * @param {Object} walletAddress Wallet address struct with the public key to copy
   */
  $scope.copyClipboardPublic = function(walletAddress) {
      var pubKey = new Bitcoin.ECPubKey(walletAddress.pubKey, true);
      var publicHex = pubKey.toHex();
      clipboard.copy(publicHex, 'Copied public key to clipboard');
  };

  /**
   * Saves the store
   */
  $scope.saveStore = function() {
      var identity = DarkWallet.getIdentity();
      identity.store.save();
  };

}]);
});
