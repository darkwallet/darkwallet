define(['./module', 'util/btc'], function (directives, BtcUtils) {

directives.directive('btcAddress', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue) {
        if (viewValue) {
          var res = BtcUtils.validateAddress(viewValue);
          ctrl.$setValidity('address', res);
        }
        return viewValue;
      });
    }
  };
});

});
