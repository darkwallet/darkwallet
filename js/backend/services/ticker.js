define(['backend/port'],
function(Port) {
  'use strict';
  function TickerService(core) {
      var self = this;
    // Some scope variables
    this.rates = {};

      // Port for communication with other services
      Port.connect('obelisk', function(data) {
        if (data.type == 'connected') {
          var identity = core.getCurrentIdentity();
          var currency = identity.settings.fiatCurrency;

          var client = core.getClient();
          self.setFiatCurrency(currency);
        }
 
      });

    // Handle getting ticker information
    function handleTicker(err, currency, lastRates) {
        if (err || !lastRates) {
          Port.post('gui', {type: 'error', title: 'ticker', text: "can't get ticker info", error: err});
          return;
        }
        if (lastRates.hasOwnProperty('24h_avg')) {
          // Take the 24 hour average
          self.rates[currency] = lastRates['24h_avg'];
        }
        else if (lastRates.hasOwnProperty('last')) {
          // No 24 hour average means no volume, take last known value
          self.rates[currency] = lastRates['last'];
        } else {
          // No values we can use
          Port.post('gui', {type: 'error', title: 'ticker', text: "can't get ticker info"});
          console.log("[ticker] can't get ticker info", lastRates);
          return;
        }
        Port.post('wallet', {type: 'ticker', currency: currency, rates: lastRates, rate: self.rates[currency]});
        console.log("[ticker] ticker fetched");
    }

    this.setFiatCurrency = function(currency) {
        var client = core.getClient();
        if (!self.rates.hasOwnProperty(currency)) {
            console.log("[ticker] fetching ticker for", currency);
            client.fetch_ticker(currency, function(err, lastRates) {handleTicker(err, currency, lastRates)});
        }
    };
     this.btcToFiat = function(amount, currency, fiatCurrency) {
      if (currency === 'mBTC') {
        amount /= 1000;
      }
      var result = amount * this.rates[fiatCurrency];
      if (!isNaN(result)) {
        return result.toFixed(2); 
      }
    };
    
    this.fiatToBtc = function(amount, currency, fiatCurrency) {
      var result = amount / this.rates[fiatCurrency];
      var decimals = 8;
      if (currency === 'mBTC') {
        result *= 1000;
        decimals = 5;
      }
      if (!isNaN(result)) {
          return result.toFixed(decimals);
      }
    };


  }

  return TickerService;

});
