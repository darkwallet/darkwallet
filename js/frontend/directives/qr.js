define(['./module', 'qrjs'], function (directives, QRCode) {
  directives.directive('qr', function() {
    return {
      restrict: 'E',
      scope: {
        width: '=width'
      },
      template: '<img src="{{url}}" width={{width}}>',
      link: function(scope, element, attrs) {
        var options = {ecclevel: attrs.level};
        scope.url = QRCode.generatePNG(attrs.data, options);
      }
    };
  });
});
