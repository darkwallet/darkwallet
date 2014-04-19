var tests = [];
for (var file in window.__karma__.files) {
    if (/Spec\.js$/.test(file)) {
        tests.push(file);
    }
}

var mock1_url = 'base/test/mock/mock1.js';
var mock2_url = 'base/test/mock/mock2.js';

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base/js',
    
    paths: {
      'angular-mocks': '../vendors/angular-mocks/angular-mocks',
      'chrome': '../test/mock/chrome_mock'
      //'port_mock': port_mock
    },
    
    map: {
      '*': {
        'darkwallet': '../test/mock/darkwallet_mock',
        'frontend/app': '../test/mock/frontend_app'
      },
      'backend/services/ticker': {
        'backend/port': mock1_url
      },
      'frontend/controllers/calculator': {
        'frontend/port': mock1_url,
        'darkwallet': mock2_url
      },
      'frontend/controllers/contacts': {
        'darkwallet': mock1_url
      },
      'dwutil/currencyformat': {
        'darkwallet': mock1_url
      }
    },
    
    shim: {
      'angular-mocks': {
        deps: ['angular'],
        exports: 'angular.mock'
      }
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});
