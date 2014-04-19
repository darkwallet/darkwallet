define(['dwutil/currencyformat', 'base/test/mock/mock1.js'],
function (CurrencyFormatting, DarkWallet) {
  'use strict';

   describe('Currency formatting module', function() {
     
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
             EUR: 350,
             USD: 482
           }
         }
       }
     });
     
     it('converts satoshis to user bitcoin unit', function() {
       expect(CurrencyFormatting.asBtc(400000)).toBe(0.004);
       expect(CurrencyFormatting.asBtc(400000, 'mBTC')).toBe(4);
     });
     
     it('converts satoshis to user fiat unit', function() {
       expect(CurrencyFormatting.asFiat(400000)).toBe('1.40');
       expect(CurrencyFormatting.asFiat(400000, 'USD')).toBe('1.93');
     });
     
     it('formats satoshis into user unit', function() {
       expect(CurrencyFormatting.formatBtc(400000)).toBe('0.004 BTC');
       expect(CurrencyFormatting.formatBtc(400000, 'mBTC')).toBe('4 mBTC');
     });
     
     it('formats satoshis to user fiat', function() {
       expect(CurrencyFormatting.formatFiat(400000)).toBe('1.40 €');
       expect(CurrencyFormatting.formatFiat(400000, 'USD')).toBe('1.93 $');
     });
     
     it('formats satoshis to full crypto and fiat string', function() {
       expect(CurrencyFormatting.format(400000)).toBe('0.004 BTC (1.40 €)');
       expect(CurrencyFormatting.format(400000, 'mBTC')).toBe('4 mBTC (1.40 €)');
       expect(CurrencyFormatting.format(400000, null, 'USD')).toBe('0.004 BTC (1.93 $)');
       expect(CurrencyFormatting.format(400000, 'mBTC', 'USD')).toBe('4 mBTC (1.93 $)');
     });
   });
 });