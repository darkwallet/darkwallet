'use strict';

define(['./module', 'zxcvbn'], function (directives, zxcvbn) {
directives.directive('passwordStrengthMeter', function() {
  return {
    restrict: 'E',
    template: '<div></div>',
    scope: {
      password: '='
    },
    link: function($scope, element, attrs) {
      $scope.$watch('password', function() {
        if ($scope.password) {
          var z = zxcvbn($scope.password);
          element[0].innerHTML = z.score;
          element[0].setAttribute('data-score', z.score);
          element[0].setAttribute('data-crack-time', z.crack_time_display);
        } else {
          element[0].innerHTML = '';
          element[0].setAttribute('data-score', '');
          element[0].setAttribute('data-crack-time', '');
        }
        console.log($scope.password)
      });
        //require(['zxcvbn'], function(zxcvbn) {
        
        //if(ctrl.$viewValue) {
        //    
        //})
      //}
    }
  };
});
});