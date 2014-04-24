'use strict';

define(['angular-mocks', 'testUtils'], function (mocks, testUtils) {

describe('Dashboard controller', function() {
    
    var dashboardController, scope, callback, identity;
    
    beforeEach(function(done) {
      identity = {
        wallet: {
          getFreeAddress: function() {
            return {address: 'free-address'};
          }
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
      
      testUtils.loadWithCurrentStubs('frontend/controllers/dashboard', function(loadedModule) {
        mocks.module("DarkWallet.controllers");
        mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
          scope = $rootScope.$new();
          dashboardController = $controller('DashboardCtrl', {$scope: scope});
          done();
        }]);
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    });
    
    it('is initialized properly', function() {
      expect(scope.dashboard).toEqual({});
    });
    
    it('shows a free address on ready', function() {
      callback({type: 'ready'});
      expect(scope.dashboard.address).toBe('free-address');
    });
    
  });
});