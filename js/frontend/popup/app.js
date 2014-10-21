/**
 * Minimal file for the popup
 */
'use strict';

define([
    'require',
    'angular',
    'angular-animate',
    'mm.foundation',
    'angular-translate',
    'angular-translate-loader-static-file',
    'frontend/popup/controller',
    'frontend/popup/providers',
    'frontend/controllers/calculator',
    'frontend/controllers/send',
    'frontend/controllers/notifications',
    'frontend/controllers/ngmodal',
    'frontend/filters/currency',
    'frontend/filters/i18n',
    'frontend/providers/wallet',
    'frontend/providers/sounds',
    'frontend/providers/modals',
    'frontend/providers/broadcast',
    'frontend/directives/identicon',
    'frontend/directives/validation'
], function (require, angular) {
    var identity = require('darkwallet').getIdentity();
    var app = angular.module('DarkWallet', [
      'mm.foundation',
      'ngAnimate',
      'pascalprecht.translate',
      'DarkWallet.controllers',
      'DarkWallet.filters',
      'DarkWallet.providers',
      'DarkWallet.directives'
    ]);
    // angular-translate configuration.
    app.config(function($translateProvider) {
      $translateProvider.useStaticFilesLoader({
        prefix: '../i18n/',
        suffix: '.json'
      });
      var language = identity ? identity.settings.language : null;
      $translateProvider.preferredLanguage(language || 'en_US');
    });
    // In case we need to initialize something after the application is created.
    app.initialize = function() {
    };
    angular.bootstrap(document, ['DarkWallet']);
    return app;
});
