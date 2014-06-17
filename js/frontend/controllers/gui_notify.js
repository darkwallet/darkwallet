/**
 * @fileOverview GuiNotifyCtrl Angular Controller
 */

'use strict';

define(['./module', 'frontend/port'], function (controllers, Port) {
  controllers.controller('GuiNotifyCtrl', ['$scope', 'notify', '$timeout', function($scope, notify, $timeout) {

  var timeout;

  /**
   * Trigger a screen refresh, gets called from $timeout
   * so not need to apply.
   */
  var refresh = function() {
      timeout = false;
  };

  /**
   * Schedule a refresh 200ms into the future.
   * We throttle to avoid too many refresh if information is still arriving.
   */
  var scheduleRefresh = function() {
      if (timeout) {
          $timeout.cancel(timeout);
      }
      timeout = $timeout(refresh, 200);
  };

  /**
   * Gui service, connect to report events on page.
   */
  Port.connectNg('gui', $scope, function(data) {
      if (data.type == 'height') {
          $scope.currentHeight = data.value;
      }
      else if (data.type == 'text' || data.type == 'note') {
          notify.note('gui', data.text);
      }
      else if (data.type == 'error') {
          notify.error(data.title || 'gui', data.text);
      }
      else if (data.type == 'mixer') {
          notify.note('mixing', data.state);
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      }
      else if (data.type == 'warning') {
          notify.warning('gui', data.text);
      }
      if (['height', 'balance', 'timestamps'].indexOf(data.type) > -1) {
          scheduleRefresh();
      }
  });


  }]);
});
