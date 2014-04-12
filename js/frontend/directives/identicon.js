define(['./module', 'identicon', 'bitcoinjs-lib'], function (directives, Identicon, Bitcoin) {
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
        function createFromBytes(dataBytes) {
          var data = new Identicon(Bitcoin.convert.bytesToHex(dataBytes), iconSize).toString();
          element.html('<img class="identicon" src="data:image/png;base64,' + data + '">');
        }
        // Watch for hash changes
        scope.$watch('hash', function() {
          if (scope.hash) {
            var pubKeyBytes = Bitcoin.convert.hexToBytes(scope.hash);
            // take 11 bytes: 22 hex - 60 bit shape, 28 bit color
            createFromBytes(pubKeyBytes.slice(8,19));
          }
        })
      }
    }
  });
});
