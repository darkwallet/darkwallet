/**
 * configure RequireJS
 * prefer named modules to long paths
 */
'use strict';

requirejs.config({
  deps: [
    'frontend/popup/app'
  ],
  callback: function(app) {
    app.initialize();
  }
});
