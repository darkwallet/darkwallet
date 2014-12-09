'use strict';

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
      template: '<input type="range" min="{{min}}" max="{{max}}" step="{{step}}" style="width:100%"/>',
      link: function(scope, element, attrs) {
        var slider = element.children()[0];

        // Set initial value
        slider.value = scope.value;

        // Register onchange event
        slider.onchange = function() {
            scope.$apply(function(){
                scope.value = slider.value;
            });
        };
      }
    };
  });
});
