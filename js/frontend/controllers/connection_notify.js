/**
 * @fileOverview ConnectionNotifyCtrl Angular Controller
 */

'use strict';

define(['./module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {
  controllers.controller('ConnectionNotifyCtrl', ['$scope', 'notify', function($scope, notify) {

  var closingConnection = false;
  console.log("connection notify");

  // Obelisk service, connect to get notified on events and connection.
  Port.connectNg('obelisk', $scope, function(data) {
      switch(data.type) {
          case 'connected':
              closingConnection = false;
              var connections = DarkWallet.getIdentity().connections;
              notify.success('connected', connections.servers[connections.selectedServer].name);
              break;
          case 'disconnect':
              closingConnection = true;
              break;
          case 'disconnected':
              if (!closingConnection) {
                  var connections = DarkWallet.getIdentity().connections;
                  notify.warning('disconnected', connections.servers[connections.selectedServer].name);
                  $scope.$apply();
              }
              break;
          case 'connectionError':
              notify.error("Error connecting", data.error);
      }
  });


  }]);
});
