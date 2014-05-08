'use strict';

define(['angular-mocks', 'testUtils'], function (mocks, testUtils) {

describe('Connection notify controller', function() {
    
    var connectionNotifyController, scope, notify, callback, identity;
    
    beforeEach(function(done) {
      identity = {
        connections: {
          servers: [
            {name: 'unsystem'}
          ],
          selectedServer: 0
        }
      };

      testUtils.stub('darkwallet', {
        getIdentity: function() {
          return identity;
        }
      });

      testUtils.stub('frontend/port', {
        connectNg: function(service, scope, c) {
          callback = c;
        }
      });
      
      testUtils.loadWithCurrentStubs('frontend/controllers/connection_notify', function(loadedModule) {
        mocks.module("DarkWallet.controllers");
        mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
          scope = $rootScope.$new();
          notify = {
            success: function(){},
            warning: function(){},
            error: function(){}
          };
          spyOn(notify, 'success');
          spyOn(notify, 'warning');
          spyOn(notify, 'error');
          connectionNotifyController = $controller('ConnectionNotifyCtrl', {
            $scope: scope,
            notify: notify
          });
          done();
        }]);
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    });
    
    it('notifies success on connect', function() {
      callback({type: 'connecting'});
      callback({type: 'connected'});
      expect(notify.success).toHaveBeenCalledWith('connected', 'unsystem');
    });
    
    it('notifies warning on disconnect', function() {
      callback({type: 'disconnected'});
      expect(notify.warning).toHaveBeenCalledWith('disconnected', 'unsystem');
    });
    
    it('allows a "manual" disconnect', function() {
      callback({type: 'disconnect'});
      callback({type: 'disconnected'});
      expect(notify.warning).not.toHaveBeenCalled();
      
      // Reconnection
      callback({type: 'connected'});
      callback({type: 'disconnected'});
      expect(notify.warning).toHaveBeenCalledWith('disconnected', 'unsystem');
    });
    
    it('notifies an error when it occurs', function() {
      callback({type: 'connectionError', error: 'fire in the datacenter'});
      expect(notify.error).toHaveBeenCalledWith('Error connecting', 'fire in the datacenter');
    });
  });
});
