'use strict';

define(['./module'], function (providers) {

  providers.factory('notify', ['toaster', 'ngProgress', function(toaster, ngProgress) {
    return {
      note: function(title, body) {
        toaster.pop('note', title, body);
      },
      error: function(title, body) {
        toaster.pop('error', title, body);
      },
      warning: function(title, body) {
        toaster.pop('warning', title, body);
      },
      success: function(title, body) {
        toaster.pop('success', title, body);
      },
      progress: ngProgress
    };
  }]);
});