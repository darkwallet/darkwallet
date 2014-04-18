define(['./module', 'darkwallet', 'util/fiat'], function (filters, DarkWallet, FiatCurrencies) {

// Convert input to BTC units
var getAsBtc = function(currency, input) {
  if (currency === 'mBTC') {
    return input / 100000;
  } else {
    return input / 100000000;
  }
};


// Calculating partial balance for history listings
var partialBalance;

// Filter that should be triggered somewhere before the history table
filters.filter('balanceStart', function() {
  return function(input) {
      partialBalance = input;
      return input;
  };
});

// Filter that calculates current row balance
filters.filter('balanceFilter', function() {
  return function(input) {
      var prevBalance = partialBalance;
      partialBalance -= input;
      return prevBalance;
  };
});


// Filter for presenting a satoshi amount into selected btc unit
filters.filter('currencyFilter', function() {
  return function(input) {
    var identity = DarkWallet.getIdentity();
    return getAsBtc(identity.settings.currency, input);
  };
});

// Filter for presenting a satoshi amount into selected btc unit with unit label
filters.filter('currencyPresenter', function() {
  return function(input) {
    /*if (input) {
        console.log('currencyPresenter');
    }*/
    var identity = DarkWallet.getIdentity();
    var tickerService = DarkWallet.service.ticker;
    var rate = tickerService.rates[identity.settings.fiatCurrency];
    var formatted = getAsBtc(identity.settings.currency, input);
    formatted += " " + identity.settings.currency;

    if (rate) {
      var converted = (input * rate / 100000000).toFixed(2);
      var currency = FiatCurrencies[identity.settings.fiatCurrency];
      formatted += " ("+converted+" "+currency.symbol+")";
    }

    return formatted;
  };
});

});
