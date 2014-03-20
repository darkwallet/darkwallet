define(['./module', 'darkwallet'], function (filters, DarkWallet) {
filters.filter('currencyFilter', function() {
  return function(input) {
    return input / 100000000;
  };
});
});
