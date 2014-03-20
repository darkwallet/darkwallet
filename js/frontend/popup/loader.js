/**
 * configure RequireJS
 * prefer named modules to long paths
 */
require.config({
  baseUrl: '/js',
});

require([
    'backend/loader',
    'require',
    'frontend/popup/app',
], function(loader, require, app) {
    app.initialize();
});

