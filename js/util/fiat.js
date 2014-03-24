define(function() {
  var symbols = {
    'eur': '€',
    'usd': '$'
  }

  // Available fiat currencies
  var fiatCurrencies = {}
  var fiatCurrency = function(code, name) {
      var symbol = symbols[code] || code;
      fiatCurrencies[code] = {name: name, code: code, symbol: symbol}
  }
  fiatCurrency('usd', 'US Dollars')
  fiatCurrency('eur', 'Euros')

  //fiatCurrency('gbp', 'UK Pounds')
  //fiatCurrency('jpy', 'Japanese Yen')
  return fiatCurrencies;
});
