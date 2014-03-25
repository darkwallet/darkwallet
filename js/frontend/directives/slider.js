define(['./module'], function (directives) {
  directives.directive('slider', function() {
    return {
      restrict: 'E',
      scope: {
        min: '=',
        max: '=',
        step: '=',
        value: '='
      },
      template: '<input type="range" min="{{min}}" max="{{max}}" step="{{step}}" ng-model="value" style="width:100%" ng-change="change()"/>',
      link: function($scope) {
        $scope.change = function() {
          $scope.value = this.value;
        };
      }
    };
  });
});