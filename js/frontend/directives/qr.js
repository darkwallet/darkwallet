define(['./module', 'qrcodejs'], function (directives, QRCode) {
  directives.directive('qr', function() {
    return {
      restrict: 'E',
      template: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>',
      link: function(scope, element, attrs) {
        var qrcode = new QRCode(element[0].firstChild, {
          width : attrs.width,
          height : attrs.height,
          correctLevel : QRCode.CorrectLevel.H,
          useSVG: true,
        });
        qrcode.makeCode(attrs.data);
      }
    };
  });
});
