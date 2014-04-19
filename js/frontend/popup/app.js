/**
 * Minimal file for the popup
 */
define([
    'angular',
    'mm.foundation',
    'frontend/popup/controller',
    'frontend/controllers/notifications',
    'frontend/filters/currency'
], function (angular) {
    'use strict';
    var app = angular.module('DarkWallet', [
      'mm.foundation',
      'DarkWallet.controllers',
      'DarkWallet.filters'
    ]);
    angular.bootstrap(document, ['DarkWallet']);
    // In case we need to initialize something after the application is created.
    app.initialize = function() {
    };
    return app;
});
