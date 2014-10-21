/**
 * loads sub modules and wraps them up into the main module
 * this should be used for top-level module definitions only
 */
'use strict';

define([
    'require',
    'angular',
    'angular-route',
    'angular-animate',
    'angular-moment',
    'mm.foundation',
    'angular-xeditable',
    'angular-translate',
    'angular-translate-loader-static-file',
    'ngProgress',
    'toaster',
    'frontend/controllers/index',
    'frontend/directives/index',
    'frontend/filters/index',
    'frontend/providers/index'
], function (require, angular) {
    var identity = require('darkwallet').getIdentity();
    var app = angular.module('DarkWallet', [
      'ngRoute', 'mm.foundation', 'xeditable', 'pascalprecht.translate',
      'ngProgress', 'ngAnimate', 'toaster', 'angularMoment',
      'DarkWallet.controllers',
      'DarkWallet.directives',
      'DarkWallet.filters',
      'DarkWallet.providers'
    ]);
    require(['domReady!'], function (document) {
        // * NOTE: the ng-app attribute should not be on the index.html when using ng.bootstrap
        angular.bootstrap(document, ['DarkWallet']);
    });
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
    return app;
});
