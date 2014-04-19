define(['./module', 'dwutil/currencyformat'], function (filters, CurrencyFormatting) {

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

// Filter like currencyFilter adding the + sign for positive amounts.
filters.filter('amountFilter', function() {
  return function(input) {
    var value = CurrencyFormatting.asBtc(input);

    var prefix = (value>=0) ? '+' : '-';
    return prefix + Math.abs(value);
  };
});

// Filter for presenting a satoshi amount into selected btc unit
filters.filter('currencyFilter', function() {
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
