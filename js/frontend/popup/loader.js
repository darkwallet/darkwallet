/**
 * configure RequireJS
 * prefer named modules to long paths
 */
require.config({
  baseUrl: '/js',
});

require([
    'backend/loader',
    'frontend/popup/app',
], function(loader, app) {
    app.initialize();
});

