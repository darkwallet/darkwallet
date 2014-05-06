'use strict';

define(['./module', 'dwutil/currencyformat'], function (filters, CurrencyFormatting) {

// Filter like currencyFilter adding the + sign for positive amounts.
filters.filter('amountFilter', function() {
  return function(input) {
    var value = CurrencyFormatting.asBtc(input);

    var prefix = (value>=0) ? '+' : '-';
    return prefix + Math.abs(value);
  };
});

// Filter for presenting a satoshi amount into selected btc unit
filters.filter('asFiat', function() {
  return function(input) {
    return CurrencyFormatting.asFiat(input);
  };
});


// Filter for presenting a satoshi amount into selected btc unit
filters.filter('asBtc', function() {
  return function(input) {
    return CurrencyFormatting.asBtc(input);
  };
});

// Filter for presenting a satoshi amount into selected btc unit with unit label
filters.filter('currencyPresenter', function() {
  return function(input) {
    return CurrencyFormatting.format(input);
  };
});

});
