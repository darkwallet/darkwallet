define(['darkwallet', 'util/fiat'], function(DarkWallet, FiatCurrencies) {

function CurrencyFormatting() {
    
}

/**
 * Convert satoshis to user bitcoin unit
 */
CurrencyFormatting.asBtc = function(satoshis, unit) {
    if (!unit) unit = DarkWallet.getIdentity().settings.currency;
    if (unit === 'mBTC') {
        return satoshis / 100000;
    } else {
        return satoshis / 100000000;
    } 
}

/**
 * Convert satoshis to user fiat unit
 */
CurrencyFormatting.asFiat = function(satoshis, fiatCurrency) {
    if (!fiatCurrency) fiatCurrency = DarkWallet.getIdentity().settings.fiatCurrency;

    var tickerService = DarkWallet.service.ticker;

    var rate = tickerService.rates[fiatCurrency];
    if (rate) {
      var converted = (satoshis * rate / 100000000).toFixed(2);
      return converted;
    }
}

/**
 * Format satoshis into user unit
 */
CurrencyFormatting.formatBtc = function(satoshis, unit) {
    if (!unit) unit = DarkWallet.getIdentity().settings.currency;

    return this.asBtc(satoshis, unit) + " " + unit;
}

/**
 * Format satoshis to user fiat
 */
CurrencyFormatting.formatFiat = function(satoshis, fiatCurrency) {
    if (!fiatCurrency) fiatCurrency = DarkWallet.getIdentity().settings.fiatCurrency;

    var converted = this.asFiat(satoshis, fiatCurrency);
    if (!(converted === undefined)) {
        var currency = FiatCurrencies[fiatCurrency];
        return converted+" "+currency.symbol
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
