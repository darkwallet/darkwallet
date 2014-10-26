'use strict';

var tests = [];
for (var file in window.__karma__.files) {
    if (/Spec\.js$/.test(file)) {
        tests.push(file);
    }
}

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base/js',
    
    paths: {
      'angular-mocks': '../vendors/angular-mocks/angular-mocks',
      'date-mock': '../test/mock/date',
      'chrome': '../test/mock/chrome_mock',
      'testUtils': '../test/mock/testUtils',
      'frontend/app': '../test/mock/frontend_app',
      'darkwallet': '../test/mock/darkwallet_mock',
      'available_languages': '../test/mock/available_languages'
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
