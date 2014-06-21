/**
 * @fileOverview AddressesCtrl angular controller
 */
'use strict';

define(['./module', 'bitcoinjs-lib', 'darkwallet'],
function (controllers, Bitcoin, DarkWallet) {
  controllers.controller('AddressesCtrl', ['$scope', '$history', '$wallet', 'clipboard', function($scope, $history, $wallet, clipboard) {

  // Filters
  $scope.addrFilter = $history.addrFilter;
  $scope.nPages = 0;
  $scope.page = 0;
  var limit = 10;

  if ($scope.pocket.type === 'readonly' && $scope.addrFilter === 'unused') {
      $scope.addrFilter = 'all';
  }

  $scope.setCurrentAddress = function(address, editForm) {
      $scope.currentAddress = address;
      $scope.currentForm = editForm;
  };

  /**
   * Generate an address
   * @param {Integer} branchId
   * @param {Integer} n
   * @return {Object} Wallet address struct
   */
  $scope.generateAddress = function(branchId, n) {
      var walletAddress = $wallet.generateAddress(branchId, n);
      $scope.addresses.push(walletAddress);
      $scope.allAddresses.push(walletAddress);
      return walletAddress;
  };

  /**
   * Sets an address filter
   * @param {String} name Filter name
   */
  $scope.setAddressFilter = function(name) {
      $history.setAddressFilter(name);
      $scope.addrFilter = name;
      $scope.allAddresses = $scope.pocket.addresses.filter($scope.addressFilter);
      $scope.nPages = Math.ceil($scope.allAddresses.length/limit);
      $scope.page = 0;
      $scope.addresses = $scope.allAddresses.slice($scope.page*limit, ($scope.page*limit) + limit);
      
  };

  $scope.setPage = function(page) {
      $scope.page = page;
      $scope.addresses = $scope.allAddresses.slice($scope.page*limit, ($scope.page*limit) + limit);
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

  /**
   * Watch for pocket change
   */
  $scope.$watch('pocket.name', function() {
      $scope.setAddressFilter($scope.addrFilter);
  })
}]);
});
