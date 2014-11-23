/**
 * Create Safe Browser links
 */
'use strict';

define(['./module'], function (directives) {

  directives.directive('ngSafebrowser', function() {
    return {
        restrict: 'A',
        scope: {
          ngSafebrowser: '='
        },
        link: function(scope, element, attributes) {
            var safe_regex = /[^a-zA-Z0-9]+/g;
            scope.$watch('ngSafebrowser', function(value) {
                if (value) {
                    element.attr('href', '#/browser/' + value.replace(safe_regex, ""));
                }
            });
        }
    };
  });

});

