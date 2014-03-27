define(['./module', 'util/btc'], function (directives, BtcUtils) {

directives.directive('btcAddress', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue) {
        if (viewValue) {
          try {
            BtcUtils.decodeAddress(viewValue)
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
