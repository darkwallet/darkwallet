/**
 * Minimal file for the popup
 */
define([
    'require',
    'angular',
    'mm.foundation',
    'frontend/popup/controller'
], function (require, angular) {
    'use strict';
    var app = angular.module('DarkWallet', [
      'mm.foundation',
      'DarkWallet.controllers'
    ]);
    require(['domReady!'], function (document) {
        // * NOTE: the ng-app attribute should not be on the index.html when using ng.bootstrap
        angular.bootstrap(document, ['DarkWallet']);
    });
    // In case we need to initialize something after the application is created.
    app.initialize = function() {
    }
    return app;
});
