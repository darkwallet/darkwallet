/**
 * @fileOverview GuiNotifyCtrl Angular Controller
 */

'use strict';

define(['./module', 'frontend/port'], function (controllers, Port) {
  controllers.controller('GuiNotifyCtrl', ['$scope', 'notify', function($scope, notify) {

  // Gui service, connect to report events on page.
  Port.connectNg('gui', $scope, function(data) {
      if (data.type == 'balance') {
      }
      else if (data.type == 'height') {
          $scope.currentHeight = data.value;
      }
      else if (data.type == 'text' || data.type == 'note') {
          notify.note('gui', data.text);
      }
      else if (data.type == 'error') {
          notify.error(data.title || 'gui', data.text);
      }
      else if (data.type == 'warning') {
          notify.warning('gui', data.text);
      }
      if (['height', 'balance', 'timestamps'].indexOf(data.type) > -1) {
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      }
  });


  }]);
});
