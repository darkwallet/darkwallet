define(['./module', 'qrcodejs'], function (directives, QRCode) {
  directives.directive('qrSaveButton', ['$window', function($window) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var div = $window.document.createElement('div');
        var qrcode = new QRCode(div, {
          width : attrs.width,
          height : attrs.height,
          correctLevel : QRCode.CorrectLevel.H,
          useSVG: true
        });
        qrcode.makeCode(attrs.data);
        div.firstChild.setAttribute('width', '400');
        div.firstChild.setAttribute('height', '400');
        element[0].setAttribute('href','data:image/svg+xml;charset=utf-8,' + 
          encodeURIComponent(div.innerHTML));
        element[0].setAttribute('download', attrs.data + '.svg');
      }
    };
  }]);
});