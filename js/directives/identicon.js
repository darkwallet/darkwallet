define(['./module', 'darkwallet', 'identicon', 'bitcoinjs-lib'], function (directives, DarkWallet, Identicon, Bitcoin) {
  directives.directive('identicon', function () {
    return {
      restrict: 'E', // element
      scope: {
        hash: '=',
        iconSize: '='
      },
      link: function(scope, element, attrs) {
        var iconSize = scope.iconSize | 32;

        // Create canvas element
        var canvas = document.createElement('canvas');
        canvas.setAttribute("width", iconSize);
        canvas.setAttribute("height", iconSize);
        element[0].appendChild(canvas);

        // Create the identicon
        function createFromBytes(dataBytes) {
          return new Identicon(canvas, Bitcoin.convert.bytesToNum(dataBytes), iconSize);
        }
        if (scope.hash) {
          var pubKeyBytes = Bitcoin.convert.hexToBytes(scope.hash);
          createFromBytes(pubKeyBytes.slice(8,16));
        }
      }
    };
  });
});
