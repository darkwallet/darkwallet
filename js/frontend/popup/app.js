/**
 * Minimal file for the popup
 */
'use strict';

define([
    'angular',
    'available_languages',
    'angular-animate',
    'mm.foundation',
    'angular-translate',
    'angular-translate-loader-partial',
    'frontend/popup/controller',
    'frontend/popup/providers',
    'frontend/controllers/calculator',
    'frontend/controllers/send',
    'frontend/controllers/notifications',
    'frontend/controllers/ngmodal',
    'frontend/controllers/translator',
    'frontend/filters/currency',
    'frontend/filters/i18n',
    'frontend/providers/wallet',
    'frontend/providers/sounds',
    'frontend/providers/modals',
    'frontend/providers/broadcast',
    'frontend/directives/identicon',
    'frontend/directives/validation'
], function (angular, AvailableLanguages) {
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
    app.config(function($translateProvider, $translatePartialLoaderProvider) {
      $translateProvider.useLoader('$translatePartialLoader', {
          urlTemplate: "{part}/{lang}.json"
      });
      $translatePartialLoaderProvider.addPart('../i18n');
      $translateProvider.preferredLanguage(AvailableLanguages.preferedLanguage());
    });
    app.config(function($animateProvider) {
      $animateProvider.classNameFilter(/^(?:(?!ng-animate-disabled).)*$/);
    });
    // In case we need to initialize something after the application is created.
    app.initialize = function() {
    };
    angular.bootstrap(document, ['DarkWallet']);
    return app;
});
