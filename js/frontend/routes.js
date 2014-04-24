/**
 * Defines the main routes in the application.
 * The routes you see here will be anchors '#/' unless specifically configured otherwise.
 */
'use strict';

define(['frontend/app'], function (app) {
  'use strict';
  return app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/contact/:contactId', {templateUrl: 'partials/contact.html', controller: 'ContactsCtrl'});
    $routeProvider.when('/tools', {templateUrl: 'partials/tools.html', controller: 'ToolsCtrl'});
    $routeProvider.when('/wallet', {templateUrl: 'partials/wallet.html', controller: 'HistoryCtrl'});
    $routeProvider.when('/send', {templateUrl: 'partials/send.html', controller: 'WalletSendCtrl'});
    $routeProvider.when('/contacts', {templateUrl: 'partials/contacts.html', controller: 'ContactsCtrl'});
    $routeProvider.when('/lobby', {templateUrl: 'partials/lobby.html', controller: 'LobbyCtrl'});
    $routeProvider.when('/settings', {templateUrl: 'partials/settings.html', controller: 'WalletSettingsCtrl'});
    $routeProvider.when('/identities', {templateUrl: 'partials/identities.html', controller: 'IdentitiesCtrl'});
    $routeProvider.when('/new_wallet', {templateUrl: 'partials/new_wallet.html', controller: 'NewWalletCtrl'});
    $routeProvider.when('/browser/:search', {templateUrl: 'partials/browser.html', controller: 'BrowserCtrl'});
    $routeProvider.when('/browser', {templateUrl: 'partials/browser.html', controller: 'BrowserCtrl'});
    $routeProvider.when('/popup', {templateUrl: 'partials/popup.html', controller: 'PopupCtrl'});
    $routeProvider.otherwise({redirectTo: '/wallet'});
  }]);
});
