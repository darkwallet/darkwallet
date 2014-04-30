'use strict';

define(['backend/port'],
function(Port) {
    function TickerService(core) {
      var self = this;
      // Some scope variables
      self.name = 'ticker';
      self.rates = {};
      self.core = core;

      // Port for communication with other services
      Port.connect('obelisk', function(data) {
        if (data.type == 'connected') {
          var identity = self.core.getCurrentIdentity();
          var currency = identity.settings.fiatCurrency;

          self.setFiatCurrency(currency);
        }

      });
    }
    // Handle getting ticker information
    TickerService.prototype.handleTicker = function(err, currency, lastRates) {
        var self = this;
        if (err || !lastRates) {
          Port.post('gui', {
            type: 'error',
            title: 'ticker',
            text: "can't get ticker info",
            error: err
          });
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
          Port.post('gui', {
            type: 'error',
            title: 'ticker',
            text: "can't get ticker info"
          });
          console.log("[ticker] can't get ticker info", lastRates);
          return;
        }
        Port.post('wallet', {
          type: 'ticker',
          currency: currency,
          rates: lastRates,
          rate: self.rates[currency]
        });
        console.log("[ticker] ticker fetched");
    }

    TickerService.prototype.setFiatCurrency = function(currency) {
        var self = this;
        var client = self.core.getClient();
        if (!self.rates.hasOwnProperty(currency)) {
            console.log("[ticker] fetching ticker for", currency);
            client.fetch_ticker(currency, function(err, lastRates) {
                self.handleTicker(err, currency, lastRates);
            });
        }
    };

  return TickerService;

});
