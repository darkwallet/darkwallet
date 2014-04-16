define(['./module', 'util/btc', 'bitcoinjs-lib', 'util/stealth'], function (directives, BtcUtils, Bitcoin, Stealth) {

var allowedVersions = [Bitcoin.network.mainnet.addressVersion, Bitcoin.network.mainnet.p2shVersion, Stealth.version];

directives.directive('btcAddress', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue) {
        if (viewValue) {
          // Check for base58 encoded addresses
          if (Bitcoin.Address.validate(viewValue) && allowedVersions.indexOf(Bitcoin.Address.getVersion(viewValue)) != -1) {
            ctrl.$setValidity('address', true);
            return viewValue;
          }
          // Check for public keys in different formats
          try {
            BtcUtils.extractPublicKey(viewValue)
            ctrl.$setValidity('address', true);
          } catch (e) {
            ctrl.$setValidity('address', false);
          }
        } else {
          ctrl.$setValidity('address', false);
        }
        return viewValue;
      });
    }
  };
});

});
