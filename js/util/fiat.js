define(function() {
  // Available fiat currencies
  var fiatCurrencies = {}
  var fiatCurrency = function(code, name, symbol, css) {
      var symbol = symbol || code;
      fiatCurrencies[code] = {name: name, code: code, symbol: symbol, css: css}
  }
  fiatCurrency('usd', 'US Dollars', '$', 'fa-dollar')
  fiatCurrency('eur', 'Euros', '€', 'fa-euro')

  //fiatCurrency('gbp', 'UK Pounds')
  //fiatCurrency('jpy', 'Japanese Yen')
  return fiatCurrencies;
});
