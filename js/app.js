/**
 * loads sub modules and wraps them up into the main module
 * this should be used for top-level module definitions only
 */
define([
    'angular',
    'angular-route',
    'angular-animate',
    'mm.foundation',
    'ngProgress',
    'toaster',
    './controllers/index',
    './filters/index',
], function (angular) {
    'use strict';

    return angular.module('DarkWallet', [
      'ngRoute', 'mm.foundation',
      'ngProgress', 'ngAnimate', 'toaster',
      'DarkWallet.controllers',
      'DarkWallet.filters'
    ]);
});
