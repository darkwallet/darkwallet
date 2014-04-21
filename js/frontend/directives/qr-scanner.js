'use strict';

define(['./module', 'jsqrcode'], function (directives) {
  directives.directive('qrScanner', ['$interval', '$window', function($interval, $window) {
    return {
      restrict: 'E',
      scope: {
        ngSuccess: '&ngSuccess',
        ngError: '&ngError',
        ngVideoError: '&ngVideoError'
      },
      link: function(scope, element, attrs) {

        $window.URL = $window.URL || $window.webkitURL || $window.mozURL || $window.msURL;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

        var height = attrs.height || 300;
        var width = attrs.width || 250;

        var video = $window.document.createElement('video');
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        var canvas = $window.document.createElement('canvas');
        canvas.setAttribute('id', 'qr-canvas');
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        canvas.setAttribute('style', 'display:none;'); 

        angular.element(element).append(video);
        angular.element(element).append(canvas);
        var context = canvas.getContext('2d'); 
        var stopScan;
        var localMediaStream;

        var scan = function() {
          if (localMediaStream) {
            context.drawImage(video, 0, 0, 307,250);
            try {
              qrcode.decode();
            } catch(e) {
              scope.ngError({error: e});
            }
          }
        };

        var successCallback = function(stream) {
          video.src = ($window.URL && $window.URL.createObjectURL(stream)) || stream;
          localMediaStream = stream;

          scope.video = video;
          video.play();
          stopScan = $interval(scan, 500);
        };

        // Call the getUserMedia method with our callback functions
        if (navigator.getUserMedia) {
          navigator.getUserMedia({video: true}, successCallback, function(e) {
            scope.ngVideoError({error: e});
          });
        } else {
          scope.ngVideoError({error: new Error('Native web camera streaming (getUserMedia) not supported in this browser.')});
        }

        element.bind('$destroy', function() {
          if (localMediaStream) {
            localMediaStream.stop();
          }
          if (stopScan) {
            $interval.cancel(stopScan);
          }
        });

        qrcode.callback = function(data) {
          scope.ngSuccess({data: data});
        };
      }
    };
  }]);
});