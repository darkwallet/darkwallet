/**
 * Create Safe Browser links
 */
'use strict';

define(['./module', 'async'], function (directives) {

  directives.directive('ngSafebrowser', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            var safe_regex = /[^a-zA-Z0-9]+/g;
            element.attr('href', '#/browser/' + attributes.ngSafebrowser.replace(safe_regex, ""));
        }
    };
  });

});

