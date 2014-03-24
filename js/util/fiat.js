define(function() {
  // Available fiat currencies
  var fiatCurrencies = {}
  var fiatCurrency = function(code, name) {
      fiatCurrencies[code] = {name: name, code: code}
  }
  fiatCurrency('usd', 'US Dollars')
  fiatCurrency('eur', 'Euros')
  fiatCurrency('ukp', 'UK Pounds')
  fiatCurrency('jpy', 'Japanese Yen')
  return fiatCurrencies;
});
