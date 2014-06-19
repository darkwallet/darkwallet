/**
 * BitID
 */
'use strict';

define(['./module', 'darkwallet', 'bitcoinjs-lib'], function (controllers, DarkWallet, Bitcoin) {
  controllers.controller('BitIdCtrl', ['$scope', '$window', '$http', 'notify', function($scope, $window, $http, notify) {
      $scope.site = '';
      var bitid_uri;
      var callback_uri;
      
      var parseUri = function(uri) {
        var a = document.createElement('a');
        a.href = decodeURIComponent(uri).replace('bitid:', 'http:');
        $scope.site = a.hostname;
        bitid_uri = uri;
        callback_uri = a.href;
      };
      
      $scope.close = function() {
        DarkWallet.service.content.highlightPreviousTab(function() {
          $window.close();
        });
      };
      
      
      /**
       * Sign and verify the given text
       */
      var signText = function(privKey, address, text) {
          var sig = Bitcoin.Message.sign(privKey, text);

          var res = Bitcoin.Message.verify(address, sig, text);

          var sigText = Bitcoin.convert.bytesToBase64(sig);

          return sigText;
      };
      
      var sign = function(text) {
        var address = '1CMRL89LAAj7J9DUqeHek1Ux4NqQgjJ13L';
        var identity = DarkWallet.getIdentity();
        var walletAddress = identity.wallet.getWalletAddress(address);
        var signature;
        identity.wallet.getPrivateKey(walletAddress.index, 'ara', function(privKey) {
          signature = signText(privKey, walletAddress.address, text);
        });
        return signature;
      };
      
      $scope.login = function() {
        var params = {
          url: callback_uri,
          //dataType: "json",
          method: "POST",
          data: JSON.stringify({
            "uri" : bitid_uri, 
            "address" : "1CMRL89LAAj7J9DUqeHek1Ux4NqQgjJ13L", 
            "signature" : sign(bitid_uri)
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        $http(params)
          .success(function(data, status, headers, config) {
            notify.success('Success');
            $scope.close();
          }).error(function(data, status, headers, config) {
            notify.error('Error');
          });
      };
      
      if (location.hash.split('?')[1]) {
        parseUri(location.hash.split('?')[1].split('=')[1]);
      }
    }]);
});