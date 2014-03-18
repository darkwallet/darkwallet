/**
 * loads sub modules and wraps them up into the main module
 * this should be used for top-level module definitions only
 */
define([
    'angular',
    'angular-route',
    'angular-animate',
    'angular-qrcode',
    'mm.foundation',
    'ngProgress',
    'toaster',
    './controllers/index',
    './directives/index',
    './filters/index'
], function (angular) {
    'use strict';

    return angular.module('DarkWallet', [
      'ngRoute', 'mm.foundation',
      'ngProgress', 'ngAnimate', 'toaster',
      'monospaced.qrcode',
      'DarkWallet.controllers',
      'DarkWallet.directives',
      'DarkWallet.filters'
    ]);
});
