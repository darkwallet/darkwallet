define(['./module', 'darkwallet'], function (filters, DarkWallet) {
filters.filter('currencyFilter', function() {
  return function(input) {
    return input / 100000000;
  };
});
filters.filter('currencyPresenter', function() {
  return function(input) {
    var walletService = DarkWallet.service().getWalletService();
    var rate = walletService.rates[walletService.currency];
    var formatted = input / 100000000 + "mBTC";

    if (rate) {
      var converted = (input * rate / 100000000).toFixed(2);
      formatted += " ("+converted+" "+walletService.currency+")";
    }

    return formatted;
  };
});

});
