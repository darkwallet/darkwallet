/*
 * @fileOverview Background service running for the wallet
 */
define(['testUtils'], function(testUtils) {
  'use strict';
  describe('Ticker service', function() {

    var core, ticker, Port;
    
    beforeEach(function(done) {
      
      testUtils.stub('backend/port', {
        connect: function(service, callback) {
          callback({type: 'connected'});
        },
        post: function(service, obj) {}
      });
      
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
      testUtils.loadWithCurrentStubs('backend/services/ticker', function(TickerService) {
        Port = require('backend/port');
        spyOn(Port, 'post');
        ticker = new TickerService(core);
        done();
      });
    });
    
    afterEach(function() {
      testUtils.reset();
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

