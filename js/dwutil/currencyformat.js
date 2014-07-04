'use strict';

define(['darkwallet', 'util/fiat', 'big'],
    function(DarkWallet, FiatCurrencies, Big) {

function CurrencyFormatting() {

}

var symbol = {
  'BTC': '฿',
  'mBTC': 'm฿',
  'bits': 'bits'
}

/**
 * Convert user amount (from input) to satoshis
 * TODO: we probably want a function that takes a string
 * and parses it carefully.
 */
CurrencyFormatting.asSatoshis = function(amount, unit) {
    var satoshis;
    if (!unit) unit = DarkWallet.getIdentity().settings.currency;
    if (unit === 'bits') {
        satoshis = Math.pow(10, 2);
    } else if (unit === 'mBTC') {
        satoshis = Math.pow(10, 5);
    } else {
        satoshis = Math.pow(10, 8);
    }
    var biAmount = new Big(amount);
    return parseInt(biAmount.times(satoshis).toFixed(0));
}


/**
 * Convert satoshis to user bitcoin unit
 */
CurrencyFormatting.asBtc = function(satoshis, unit) {
    if (!unit) unit = DarkWallet.getIdentity().settings.currency;
    if (unit === 'bits') {
        return satoshis / Math.pow(10, 2);
    } else if (unit === 'mBTC') {
        return satoshis / Math.pow(10, 5);
    } else {
        return satoshis / Math.pow(10, 8);
    }
}

/**
 * Convert satoshis to user fiat unit
 */
CurrencyFormatting.asFiat = function(satoshis, fiatCurrency) {
    if (!fiatCurrency) fiatCurrency = DarkWallet.getIdentity().settings.fiatCurrency;

    var tickerService = DarkWallet.service.ticker;
    var decimalDigits = FiatCurrencies[fiatCurrency].decimal_digits;

    var rate = tickerService.rates[fiatCurrency];
    if (rate) {
      var converted = (satoshis * rate / Math.pow(10, 8));
      return CurrencyFormatting.addThousands(converted, converted.toFixed(decimalDigits));
    }
}

CurrencyFormatting.btcToFiat = function(amount, currency, fiatCurrency) {
    if (FiatCurrencies[fiatCurrency] === undefined) {
      return;
    }
    var tickerService = DarkWallet.service.ticker;
    var decimalDigits = FiatCurrencies[fiatCurrency].decimal_digits;

    if (currency === 'mBTC') {
      amount /= 1000;
    } else if (currency === 'bits') {
      amount /= 1000000;
    }
    var result = amount * tickerService.rates[fiatCurrency];
    if (!isNaN(result)) {
      return result.toFixed(decimalDigits);
    }
};

CurrencyFormatting.fiatToBtc = function(amount, currency, fiatCurrency) {
    var tickerService = DarkWallet.service.ticker;
    var result = amount / tickerService.rates[fiatCurrency];
    var decimals = 8;
    if (currency === 'mBTC') {
      result *= 1000;
      decimals = 5;
    } else if (currency === 'bits') {
      result *= 1000000;
      decimals = 2;
    }
    if (!isNaN(result)) {
        return result.toFixed(decimals);
    }
};

/**
 * Add dots for thousands if needed
 */
CurrencyFormatting.addThousands = function(value, formatted) {
    formatted = formatted || new Big(value).toFixed();
    if (value>=1000) {
        var parts = formatted.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        value = parts.join(".");
        return value;
    }
    return formatted;
}

/**
 * Format satoshis into user unit
 */
CurrencyFormatting.formatBtc = function(satoshis, unit) {
    if (unit === 'smart') {
      if (String(satoshis).length > 8) {
        unit = 'BTC';
      } else if (String(satoshis).length > 2) {
        unit = 'bits';
      } else {
        unit = 'mBTC';
      }
    }
    if (!unit) unit = DarkWallet.getIdentity().settings.currency;

    var btcPrice = this.asBtc(satoshis, unit);
    return CurrencyFormatting.addThousands(btcPrice) + " " + symbol[unit];
}

/**
 * Format satoshis to user fiat
 */
CurrencyFormatting.formatFiat = function(satoshis, fiatCurrency) {
    if (!fiatCurrency) fiatCurrency = DarkWallet.getIdentity().settings.fiatCurrency;

    var converted = this.asFiat(satoshis, fiatCurrency);
    if (!(converted === undefined)) {
        var currency = FiatCurrencies[fiatCurrency];
        return converted+" "+currency.symbol_native;
    }
}

/**
 * Format satoshis to full crypto and fiat string
 */
CurrencyFormatting.format = function(satoshis, unit, fiatCurrency) {
    var identity = DarkWallet.getIdentity();

    if (!fiatCurrency) fiatCurrency = identity.settings.fiatCurrency;
    if (!unit) unit = identity.settings.currency;

    var btcs = this.formatBtc(satoshis, unit);
    var fiats = this.formatFiat(satoshis, fiatCurrency);

    var formatted = btcs;
    if (fiats) {
        formatted += " ("+fiats+")";
    }
    return formatted;
}

return CurrencyFormatting;

});
