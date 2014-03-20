/**
 * configure RequireJS
 * prefer named modules to long paths
 */
require.config({
  baseUrl: '/js',
});

require([
    'backend-loader',
    'require',
    'app',
    'routes'
], function(loader, require, app, routes) {
    app.initialize();
});

