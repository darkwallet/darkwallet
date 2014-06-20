/**
 * BitID
 */
'use strict';

define(['./module', 'darkwallet', 'bitcoinjs-lib'], function (controllers, DarkWallet, Bitcoin) {
  var convert = Bitcoin.convert;
  var CryptoJS = Bitcoin.CryptoJS;

  controllers.controller('BitIdCtrl', ['$scope', '$window', '$http', 'notify', '$location', function($scope, $window, $http, notify, $location) {
      $scope.site = '';
      var bitid_uri;
      var callback_uri;
      
      var parseUri = function(uri) {
        // decode the uri
        bitid_uri = decodeURIComponent(uri);
        var isDev = bitid_uri.search("u=1");

        // parse uri and prepare some variables
        var a = document.createElement('a');
        a.href = bitid_uri.replace('bitid:', isDev ? 'http:' : 'https:');
        $scope.site = a.hostname;
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

          var sigText = convert.bytesToBase64(sig);

          return sigText;
      };
      
      var sign = function(site, text) {
        var identity = DarkWallet.getIdentity();

        // Generate a random n
        var siteHash = CryptoJS.SHA256('Bitid site:'+identity.wallet.mpk+site);
        siteHash = convert.wordArrayToBytes(siteHash);
        var siteN = convert.bytesToNum(siteHash.slice(0, 4));

        // Get an id key and address for n
        var idKey = identity.wallet.getIdentityKey(siteN);
        var address = idKey.getPub().getAddress(identity.wallet.versions.address).toString();

        // sign
        var signature = signText(idKey, address, text);
        return {address: address, signature: signature};
      };
      
      $scope.login = function() {
        var signed = sign($scope.site, bitid_uri);
        console.log(signed);
        console.log(bitid_uri);
        var params = {
          url: callback_uri,
          //dataType: "json",
          method: "POST",
          data: JSON.stringify({
            "uri" : bitid_uri, 
            "address" : signed.address, 
            "signature" : signed.signature
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
