'use strict';

define(['util/fiat'], function(fiatCurrencies) {
  
  describe('Fiat Currencies data', function() {
    
    var areAllDefined = function(key) {
      var currency;
      for(currency in fiatCurrencies) {
        expect(fiatCurrencies[currency][key]).toBeDefined();
      }
    };
    
    var areAllTruthy = function(key) {
      var currency;
      for(currency in fiatCurrencies) {
        expect(fiatCurrencies[currency][key]).toBeTruthy();
      }
    };
    
    it('has all symbols defined', function() {
      areAllTruthy('symbol');
    });
    
    it('has all names defined', function() {
      areAllTruthy('name');
    });
    
    it('has all native symbols defined', function() {
      areAllTruthy('symbol_native');
    });
    
    it('has all decimals digits defined', function() {
      areAllDefined('decimal_digits');
    });
    
    it('has all roundings defined', function() {
      areAllDefined('rounding');
    });
    
    it('has all codes defined', function() {
      areAllTruthy('code');
    });
    
    it('has all plural names defined', function() {
      areAllTruthy('name_plural');
    });
  })
});