'use strict';

define(['./module', 'identicon', 'bitcoinjs-lib'], function (directives, Identicon, Bitcoin) {
  var iconCache = {};
  var hashCache = {};
  directives.directive('identicon', function () {
    return {
      restrict: 'E', // element
      scope: {
        hash: '=',
        data: '=',
        iconSize: '='
      },
      link: function(scope, element, attrs) {
        var iconSize = scope.iconSize || 32;

        // Create the identicon
        function createFromHex(dataHex) {
          var data;
          var iconId = [dataHex, iconSize];
          if (iconCache.hasOwnProperty(iconId)) {
              data = iconCache[iconId];
          } else {
              data = new Identicon(dataHex, iconSize).toString();
              iconCache[iconId] = data;
          }
          element.html('<img class="identicon" src="data:image/png;base64,' + data + '">');
        }
        // Watch for hash changes
        scope.$watch('hash', function() {
          if (scope.hash) {
            // take 11 bytes: 22 hex - 60 bit shape, 28 bit color
            // skip first 8 bytes to avoid headers (the input can be arbitrary hex)
            createFromHex(scope.hash.substr(16, 38));
          }
        });
        scope.$watch('data', function() {
          if (scope.data) {
            var hash;
            if (hashCache.hasOwnProperty(scope.data)) {
                hash = hashCache[scope.data];
            } else {
                hash = Bitcoin.CryptoJS.SHA256(scope.data).toString();
                hashCache[scope.data] = hash;
            }
            // take 11 bytes: 22 hex - 60 bit shape, 28 bit color
            // skip first 8 bytes to avoid headers (the input can be arbitrary hex)
            createFromHex(hash.substr(16, 38));
          }
        });
      }
    };
  });
});
