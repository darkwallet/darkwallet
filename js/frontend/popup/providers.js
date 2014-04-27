'use strict';

define(['frontend/providers/module'], function (providers) {

  providers.value('notify', {
    note: function() {},
    error: function() {},
    warning: function() {},
    success: function() {}
  });
  providers.value('modals', {});
});