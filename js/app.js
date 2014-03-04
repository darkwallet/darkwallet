'use strict';


// Declare app level module which depends on filters, and services
angular.module('DarkWallet', [
  'ngRoute',
  'ngProgress', 'ngAnimate', 'toaster',
  'DarkWallet.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/contacts', {templateUrl: 'partials/contacts.html', controller: 'ContactsCtrl'});
  $routeProvider.when('/darkwallet', {templateUrl: 'partials/darkwallet.html', controller: 'DarkWalletCtrl'});
  $routeProvider.when('/history', {templateUrl: 'partials/wallet/history.html', controller: 'HistoryCtrl'});
  $routeProvider.when('/lobby', {templateUrl: 'partials/lobby.html', controller: 'LobbyCtrl'});
  $routeProvider.when('/new_wallet', {templateUrl: 'partials/new_wallet.html', controller: 'NewWalletCtrl'});
  $routeProvider.when('/popup', {templateUrl: 'partials/popup.html', controller: 'PopupCtrl'});
  $routeProvider.when('/send', {templateUrl: 'partials/wallet/send.html', controller: 'WalletSendCtrl'});
  $routeProvider.when('/receive', {templateUrl: 'partials/wallet/receive.html', controller: 'WalletReceiveCtrl'});
  $routeProvider.when('/settings', {templateUrl: 'partials/settings.html', controller: 'WalletSettingsCtrl'});
  $routeProvider.otherwise({redirectTo: '/history'});
}]);
