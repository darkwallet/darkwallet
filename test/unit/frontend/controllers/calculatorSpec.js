/**
 * @fileOverview CalculatorCtrl angular controller
 */
'use strict';

define(['angular-mocks', 'testUtils'],
function (mocks, testUtils) {
  describe('Calculator controller', function() {
    
    var calculatorController, scope;
    
    beforeEach(function(done) {
      testUtils.stub('frontend/port', {
        connectNg: function(service, scope, callback) {
          callback({type: 'ready'});
        }
      });

      testUtils.stub('darkwallet', {
        getIdentity: function() {
          return {
            settings: {
              currency: 'BTC',
              fiatCurrency: 'EUR'
            }
          };
        },
        service: {
          ticker: {
            rates: {
              EUR: 80
            },
            btcToFiat: function(amount, currency, fiatCurrency) {
              if (currency == 'USD') {
                return null;
              }
              return amount * 80;
            },
            fiatToBtc: function(amount, currency, fiatCurrency) {
              return amount / 80;
            }
          }
        }
      });
      
      testUtils.loadWithCurrentStubs('frontend/controllers/calculator', function(loadedModule) {
        mocks.module("DarkWallet.controllers");
        mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
          scope = $rootScope.$new();
          var _ = function(s) {
            return s;
          }
          calculatorController = $controller('CalculatorCtrl', {$scope: scope, _Filter: _});
          done();
        }]);
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    });
    
    it('is created properly', function() {
      expect(scope.calculator).toEqual({
        amount: 1,
        converted: 0,
        amountFocused: false,
        convertedFocused: false
      });
      expect(scope.settings.currency).toBe('BTC');
      expect(scope.fiatSymbol).toBe('€');
    });
    
    it('converts crypto to fiat', function() {
      scope.$apply(function() {
        scope.calculator.amount = 40;
      });
      expect(scope.calculator.converted).toBe('3200.00');
    });
    
    it('converts fiat to crypto', function() {
      scope.$apply();
      scope.$apply(function() {
        scope.calculator.converted = 40;
        scope.calculator.convertedFocused = true;
      });
      expect(scope.calculator.amount).toBe('0.50000000');
    });
  });
});
