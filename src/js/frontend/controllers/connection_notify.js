/**
 * @fileOverview ConnectionNotifyCtrl Angular Controller
 */

'use strict';

define(['./module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {
  controllers.controller('ConnectionNotifyCtrl', ['$scope', 'notify', '_Filter', function($scope, notify, _) {

  var closingConnection = false;
  console.log("connection notify");

  var seenConnecting = false;

  // Obelisk service, connect to get notified on events and connection.
  Port.connectNg('obelisk', $scope, function(data) {
      switch(data.type) {
          case 'connecting':
              seenConnecting = true;
              break;
          case 'connected':
              closingConnection = false;
              if (seenConnecting) {
                  var connections = DarkWallet.getIdentity().connections;
                  notify.success(_('connected'), connections.servers[connections.selectedServer].name);
                  seenConnecting = false;
              }
              break;
          case 'disconnect':
              closingConnection = true;
              break;
          case 'disconnected':
              if (!closingConnection) {
                  var connections = DarkWallet.getIdentity().connections;
                  notify.warning(_('disconnected'), connections.servers[connections.selectedServer].name);
                  $scope.$apply();
              }
              break;
          case 'connectionError':
              notify.error(_('Error connecting'), _(data.error));
      }
  });


  }]);
});
