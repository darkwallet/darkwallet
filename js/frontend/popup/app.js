/**
 * Minimal file for the popup
 */
define([
    'angular',
    'mm.foundation',
    'frontend/popup/controller'
], function (angular) {
    'use strict';
    var app = angular.module('DarkWallet', [
      'mm.foundation',
      'DarkWallet.controllers'
    ]);
    angular.bootstrap(document, ['DarkWallet']);
    // In case we need to initialize something after the application is created.
    app.initialize = function() {
    }
    return app;
});
