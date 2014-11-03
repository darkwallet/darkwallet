'use strict';

define(['testUtils'], function (testUtils) {

  describe('Currency formatting module', function() {
    
    var CurrencyFormatting;
    
    beforeEach(function(done) {
      testUtils.stub('darkwallet', {
        getIdentity: function() {
          return {
            settings: {
              currency: 'BTC',
              fiatCurrency: 'EUR',
              language: 'en_US'
            }
          };
        },
        service: {
          ticker: {
            rates: {
              EUR: 350,
              USD: 482
            }
          }
        }
      });
      testUtils.loadWithCurrentStubs('dwutil/currencyformat', function(loadedModule) {
        CurrencyFormatting = loadedModule;
        done();
      });
    });

    afterEach(function() {
      testUtils.reset();
    });

    it('converts user amount to satoshis', function() {
      expect(CurrencyFormatting.asSatoshis('0.21')).toBe(21000000);
      expect(CurrencyFormatting.asSatoshis('0.21', 'bits')).toBe(21);
      expect(CurrencyFormatting.asSatoshis('0.21', 'mBTC')).toBe(21000);
    });
     
    it('converts satoshis to user bitcoin unit', function() {
      expect(CurrencyFormatting.asBtc(400000)).toBe(0.004);
      expect(CurrencyFormatting.asBtc(400000, 'mBTC')).toBe(4);
      expect(CurrencyFormatting.asBtc(400000, 'bits')).toBe(4000);
    });
     
    it('converts satoshis to user fiat unit', function() {
      expect(CurrencyFormatting.asFiat(400000)).toBe(1.4);
      expect(CurrencyFormatting.asFiat(400000, 'USD')).toBe(1.928);
    });
    
    it('converts btc to fiat', function() {
      expect(CurrencyFormatting.btcToFiat(100, 'BTC', 'EUR')).toBe('35000.00');
      expect(CurrencyFormatting.btcToFiat(100, 'mBTC', 'EUR')).toBe('35.00');
      expect(CurrencyFormatting.btcToFiat(100000, 'bits', 'EUR')).toBe('35.00');
      
      expect(CurrencyFormatting.btcToFiat(100, 'BTC', 'GALLEON')).toBeUndefined();
    });
    
    it('converts fiat to btc', function() {
      expect(CurrencyFormatting.fiatToBtc(100, 'BTC', 'EUR')).toBe('0.28571429');
      expect(CurrencyFormatting.fiatToBtc(100, 'mBTC', 'EUR')).toBe('285.71429');
      expect(CurrencyFormatting.fiatToBtc(100, 'bits', 'EUR')).toBe('285714.29');
      
      expect(CurrencyFormatting.fiatToBtc(100, 'BTC', 'GALLEON')).toBeUndefined();
    });
     
    it('formats satoshis into user unit', function() {
      expect(CurrencyFormatting.formatBtc(400000)).toBe('0.004 ฿');
      expect(CurrencyFormatting.formatBtc(400000, 'mBTC')).toBe('4 m฿');
      expect(CurrencyFormatting.formatBtc(400000, 'bits')).toBe('4,000 bits');
      expect(CurrencyFormatting.formatBtc(400000, 'smart')).toBe('4,000 bits');
      expect(CurrencyFormatting.formatBtc(400000000, 'smart')).toBe('4 ฿');
      expect(CurrencyFormatting.formatBtc(400, 'smart')).toBe('4 bits');
    });
     
    it('formats satoshis to user fiat', function() {
      expect(CurrencyFormatting.formatFiat(400000)).toBe('1.40 €');
      expect(CurrencyFormatting.formatFiat(400000, 'USD')).toBe('1.93 $');
    });
     
    it('formats satoshis to full crypto and fiat string', function() {
      expect(CurrencyFormatting.format(400000)).toBe('0.004 ฿ (1.40 €)');
      expect(CurrencyFormatting.format(400000, 'mBTC')).toBe('4 m฿ (1.40 €)');
      expect(CurrencyFormatting.format(400000, null, 'USD')).toBe('0.004 ฿ (1.93 $)');
      expect(CurrencyFormatting.format(400000, 'mBTC', 'USD')).toBe('4 m฿ (1.93 $)');
    });
  });
});
