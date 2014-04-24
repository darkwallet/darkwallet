'use strict';

define(['./module', 'util/btc', 'darkwallet'], function (directives, BtcUtils, DarkWallet) {

directives.directive('btcAddress', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      var f = function(viewValue) {
        if (viewValue) {
          var identity = DarkWallet.getIdentity();
          var validAddresses = [
              identity.wallet.versions.address,
              identity.wallet.versions.stealth.address,
              identity.wallet.versions.p2sh
          ]

          var res = BtcUtils.validateAddress(viewValue, validAddresses);
          ctrl.$setValidity('address', res);
        }
        return viewValue;
      };
      ctrl.$parsers.unshift(f);
      ctrl.$formatters.unshift(f);
    }
  };
});

});
