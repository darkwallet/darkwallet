/**
 * @fileOverview CalculatorCtrl angular controller
 */

define(['angular-mocks', 'frontend/controllers/calculator', 'base/test/mock/mock1.js', 'base/test/mock/mock2.js'],
function (mocks, CalculatorCtrl, Port, DarkWallet) {
  'use strict';
  describe('Calculator controller', function() {
    
    var calculatorController, scope;
    
    Port.mock({
      connectNg: function(service, scope, callback) {
        callback({type: 'ready'});
      }
    });
    
    DarkWallet.mock({
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
            EUR: 90
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
    
    beforeEach(function() {
      mocks.module("DarkWallet.controllers");

      mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
        scope = $rootScope.$new();
        calculatorController = $controller('CalculatorCtrl', {$scope: scope});
      }]);
    });
    
    it('is created properly', function() {
      expect(scope.calculator).toEqual({
        amount: 1,
        converted: 0,
        amountFocused: false,
        convertedFocused: false
      });
      expect(scope.selectedCurrency).toBe('BTC');
      expect(scope.fiatSymbol).toBe('€');
    });
    
    it('converts crypto to fiat', function() {
      scope.$apply(function() {
        scope.calculator.amount = 40;
      });
      expect(scope.calculator.converted).toBe(3200);
    });
    
    it('converts fiat to crypto', function() {
      scope.$apply();
      scope.$apply(function() {
        scope.calculator.converted = 40;
        scope.calculator.convertedFocused = true;
      });
      expect(scope.calculator.amount).toBe(0.5);
    });
  });
});
