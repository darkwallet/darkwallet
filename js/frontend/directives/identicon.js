define(['./module', 'identicon', 'bitcoinjs-lib'], function (directives, Identicon, Bitcoin) {
  var iconCache = {};
  directives.directive('identicon', function () {
    return {
      restrict: 'E', // element
      scope: {
        hash: '=',
        iconSize: '='
      },
      link: function(scope, element, attrs) {
        var iconSize = scope.iconSize || 32;

        // Create the identicon
        function createFromHex(dataHex) {
          var data;
          if (iconCache.hasOwnProperty(dataHex)) {
              data = iconCache[dataHex];
          } else {
              data = new Identicon(dataHex, iconSize).toString();
              iconCache[dataHex] = data;
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
        })
      }
    }
  });
});
