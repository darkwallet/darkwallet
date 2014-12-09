'use strict';

define(['./module', 'qrcodejs'], function (directives, QRCode) {
  directives.directive('qrSaveButton', ['$window', '$timeout', function($window, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var div = $window.document.createElement('div');
        var qrcode = new QRCode(div, {
          width : attrs.width || 400,
          height : attrs.height || 400,
          correctLevel : QRCode.CorrectLevel.H
        });
        qrcode.makeCode(attrs.data);
        $timeout(function() {
          var data = div.lastChild.getAttribute('src');
          element[0].setAttribute('href', data);
          element[0].setAttribute('download', attrs.data + '.png');
        }, 1);
      }
      
    };
  }]);
});