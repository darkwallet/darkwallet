/**
 * Minimal file for the popup
 */
'use strict';

define([
    'angular',
    'angular-animate',
    'mm.foundation',
    'frontend/popup/controller',
    'frontend/popup/providers',
    'frontend/controllers/calculator',
    'frontend/controllers/send',
    'frontend/controllers/notifications',
    'frontend/controllers/ngmodal',
    'frontend/filters/currency',
    'frontend/providers/wallet',
    'frontend/providers/sounds',
    'frontend/providers/modals',
    'frontend/providers/broadcast',
    'frontend/directives/identicon',
    'frontend/directives/validation'
], function (angular) {
    var app = angular.module('DarkWallet', [
      'mm.foundation',
      'ngAnimate',
      'DarkWallet.controllers',
      'DarkWallet.filters',
      'DarkWallet.providers',
      'DarkWallet.directives'
    ]);
    angular.bootstrap(document, ['DarkWallet']);
    // In case we need to initialize something after the application is created.
    app.initialize = function() {
    };
    return app;
});
