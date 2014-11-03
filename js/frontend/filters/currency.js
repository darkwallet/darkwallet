'use strict';

define(['./module', 'dwutil/currencyformat'], function (filters, CurrencyFormatting) {

// Filter like currencyFilter adding the + sign for positive amounts.
filters.filter('amountFilter', ['_Filter', function(_) {
  return function(input) {
    var value = CurrencyFormatting.asBtc(input);

    var prefix = (value>=0) ? '+' : '-';
    return prefix + Math.abs(value).toLocaleString(_());
  };
}]);

// Filter for presenting a satoshi amount into selected btc unit
filters.filter('formatBtc', function() {
  return function(input, hideSymbol) {
    return CurrencyFormatting.formatBtc(input, undefined, hideSymbol);
  };
});

filters.filter('formatFiat', function() {
  return function(input, hideSymbol) {
    return CurrencyFormatting.formatFiat(input, undefined, hideSymbol);
  };
});

// Filter for presenting a satoshi amount into selected btc unit with unit label
filters.filter('currencyPresenter', function() {
  return function(input) {
    return CurrencyFormatting.format(input);
  };
});

});
