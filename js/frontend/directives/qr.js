'use strict';

define(['./module', 'qrcodejs'], function (directives, QRCode) {
  directives.directive('qr', ['$window', function($window) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var qrcode = new QRCode(element[0], {
          width : 512,
          height : 512,
          correctLevel : QRCode.CorrectLevel.H,
        });
        qrcode.makeCode(attrs.data);
        if (attrs.width) element[0].lastChild.setAttribute('width', attrs.width);
        if (attrs.height) element[0].lastChild.setAttribute('height', attrs.height);
      }
    };
  }]);
});
