/**
 * configure RequireJS
 * prefer named modules to long paths
 */
'use strict';

require.config({
  deps: [
    'frontend/popup/app'
  ],
  callback: function(app) {
    app.initialize();
  }
});