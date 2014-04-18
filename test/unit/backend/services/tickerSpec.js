/*
 * @fileOverview Background service running for the wallet
 */
define(['backend/services/ticker', 'base/test/mock/mock1.js'], function(TickerService, Port) {
  'use strict';
  describe('Ticker service', function() {

    var core, ticker;
    beforeEach(function() {
      core = {
        getClient: function() {
          return {
            fetch_ticker: function(currency, callback) {
              var lastRates = {
                USD: {
                  '24h_avg': 500,
                  'last': 499
                },
                EUR: {
                  '24_avg': 363,
                  'last': 360
                }
              };
              if (lastRates[currency]) {
                callback(null, lastRates[currency]);
              } else {
                callback(new Error());
              }
            }
          };
        },
        getCurrentIdentity: function() {
          return {
            settings: {
              fiatCurrency: 'EUR'
            }
          };
        }
      };
      Port.mock({
        connect: function(service, callback) {
          callback({type: 'connected'});
        },
        post: function(service, obj) {}
      });
      spyOn(Port, 'post');
      
      ticker = new TickerService(core);      
    });

    it('is initialized correctly', function() {
      expect(ticker.rates).toEqual({ EUR : 360 });
      expect(Port.post).toHaveBeenCalledWith('wallet', {
        type: 'ticker',
        currency: 'EUR',
        rates: { '24_avg' : 363, last : 360 },
        rate: 360
      });
    });
    
    it('fetches another fiat currency', function() {
      ticker.setFiatCurrency('USD');
      expect(ticker.rates).toEqual({ EUR : 360, USD : 500 });
      
      ticker.setFiatCurrency('GALLEON'); // Unknown by muggle software
      expect(ticker.rates).toEqual({ EUR : 360, USD : 500 });
      expect(Port.post).toHaveBeenCalledWith('gui', {
        type : 'error',
        title : 'ticker',
        text : 'can\'t get ticker info',
        error : new Error()
      });
    });
    
    it('converts btc to fiat', function() {
      expect(ticker.btcToFiat(100, 'BTC', 'EUR')).toBe('36000.00');
      expect(ticker.btcToFiat(100, 'mBTC', 'EUR')).toBe('36.00');
      
      expect(ticker.btcToFiat(100, 'BTC', 'USD')).toBeUndefined();
    });
    
    it('converts fiat to btc', function() {
      expect(ticker.fiatToBtc(100, 'BTC', 'EUR')).toBe('0.27777778');
      expect(ticker.fiatToBtc(100, 'mBTC', 'EUR')).toBe('277.77778');
      
      expect(ticker.fiatToBtc(100, 'BTC', 'USD')).toBeUndefined();
    });
  });
});

