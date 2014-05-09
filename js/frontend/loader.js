/**
 * configure RequireJS
 * prefer named modules to long paths
 */
'use strict';

require.config({
  deps: [
    'backend/loader',
    'require',
    'frontend/app',
    'frontend/routes'
  ],
  callback: function(app, routes) {
    app.initialize();
  }
});