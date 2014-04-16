/**
 * configure RequireJS
 * prefer named modules to long paths
 */
require.config({
  baseUrl: '/js'
});

require([
    'backend/loader',
    'require',
    'frontend/app',
    'frontend/routes'
], function(loader, require, app, routes) {
    app.initialize();
});

