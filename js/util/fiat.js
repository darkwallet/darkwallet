define(function() {
  // Available fiat currencies
  // Based on http://www.localeplanet.com/api/auto/currencymap.html
  var fiatCurrencies = {
    "AED": {
      "symbol": "AED",
      "name": "United Arab Emirates Dirham",
      "symbol_native": "د.إ.\u200F",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "AED",
      "name_plural": "UAE dirhams"
    },
    "AFN": {
      "symbol": "AFN",
      "name": "Afghan Afghani",
      "symbol_native": "؋",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "AFN",
      "name_plural": "Afghan Afghanis"
    },
    "ALL": {
      "symbol": "ALL",
      "name": "Albanian Lek",
      "symbol_native": "Lek",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "ALL",
      "name_plural": "Albanian lekë"
    },
    "AMD": {
      "symbol": "AMD",
      "name": "Armenian Dram",
      "symbol_native": "դր.",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "AMD",
      "name_plural": "Armenian drams"
    },
    "AOA": {
      "symbol": "AOA",
      "name": "Angolan Kwanza",
      "symbol_native": "Kz",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "AOA",
      "name_plural": "Angolan kwanzas"
    },
    "ARS": {
      "symbol": "ARS",
      "name": "Argentine Peso",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "ARS",
      "name_plural": "Argentine pesos"
    },
    "AUD": {
      "symbol": "AU$",
      "name": "Australian Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "AUD",
      "name_plural": "Australian dollars"
    },
    "AWG": {
      "symbol": "AWG",
      "name": "Aruban Florin",
      "symbol_native": "Afl.",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "AWG",
      "name_plural": "Aruban florin"
    },
    "AZN": {
      "symbol": "AZN",
      "name": "Azerbaijani Manat",
      "symbol_native": "ман.",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "AZN",
      "name_plural": "Azerbaijani manats"
    },
    "BAM": {
      "symbol": "BAM",
      "name": "Bosnia-Herzegovina Convertible Mark",
      "symbol_native": "KM",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "BAM",
      "name_plural": "Bosnia-Herzegovina convertible marks"
    },
    "BBD": {
      "symbol": "BBD",
      "name": "Barbadian Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "BBD",
      "name_plural": "Barbadian dollars"
    },
    "BDT": {
      "symbol": "BDT",
      "name": "Bangladeshi Taka",
      "symbol_native": "৳",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "BDT",
      "name_plural": "Bangladeshi takas"
    },
    "BGN": {
      "symbol": "BGN",
      "name": "Bulgarian Lev",
      "symbol_native": "лв.",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "BGN",
      "name_plural": "Bulgarian leva"
    },
    "BHD": {
      "symbol": "BHD",
      "name": "Bahraini Dinar",
      "symbol_native": "د.ب.\u200F",
      "decimal_digits": 3,
      "rounding": 0.0,
      "code": "BHD",
      "name_plural": "Bahraini dinars"
    },
    "BIF": {
      "symbol": "BIF",
      "name": "Burundian Franc",
      "symbol_native": "FBu",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "BIF",
      "name_plural": "Burundian francs"
    },
    "BMD": {
      "symbol": "BMD",
      "name": "Bermudan Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "BMD",
      "name_plural": "Bermudan dollars"
    },
    "BND": {
      "symbol": "BND",
      "name": "Brunei Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "BND",
      "name_plural": "Brunei dollars"
    },
    "BOB": {
      "symbol": "BOB",
      "name": "Bolivian Boliviano",
      "symbol_native": "Bs",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "BOB",
      "name_plural": "Bolivian bolivianos"
    },
    "BRL": {
      "symbol": "R$",
      "name": "Brazilian Real",
      "symbol_native": "R$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "BRL",
      "name_plural": "Brazilian reals"
    },
    "BWP": {
      "symbol": "BWP",
      "name": "Botswanan Pula",
      "symbol_native": "P",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "BWP",
      "name_plural": "Botswanan pulas"
    },
    "BYR": {
      "symbol": "BYR",
      "name": "Belarusian Ruble",
      "symbol_native": "BYR",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "BYR",
      "name_plural": "Belarusian rubles"
    },
    "BZD": {
      "symbol": "BZD",
      "name": "Belize Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "BZD",
      "name_plural": "Belize dollars"
    },
    "CAD": {
      "symbol": "CA$",
      "name": "Canadian Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "CAD",
      "name_plural": "Canadian dollars"
    },
    "CDF": {
      "symbol": "CDF",
      "name": "Congolese Franc",
      "symbol_native": "FrCD",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "CDF",
      "name_plural": "Congolese francs"
    },
    "CHF": {
      "symbol": "CHF",
      "name": "Swiss Franc",
      "symbol_native": "CHF",
      "decimal_digits": 2,
      "rounding": 0.05,
      "code": "CHF",
      "name_plural": "Swiss francs"
    },
    "CLP": {
      "symbol": "CLP",
      "name": "Chilean Peso",
      "symbol_native": "$",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "CLP",
      "name_plural": "Chilean pesos"
    },
    "CNY": {
      "symbol": "CN¥",
      "name": "Chinese Yuan",
      "symbol_native": "CN¥",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "CNY",
      "name_plural": "Chinese yuan"
    },
    "COP": {
      "symbol": "COP",
      "name": "Colombian Peso",
      "symbol_native": "$",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "COP",
      "name_plural": "Colombian pesos"
    },
    "CRC": {
      "symbol": "CRC",
      "name": "Costa Rican Colón",
      "symbol_native": "\u20A1",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "CRC",
      "name_plural": "Costa Rican colóns"
    },
    "CVE": {
      "symbol": "CVE",
      "name": "Cape Verdean Escudo",
      "symbol_native": "CVE",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "CVE",
      "name_plural": "Cape Verdean escudos"
    },
    "CZK": {
      "symbol": "CZK",
      "name": "Czech Republic Koruna",
      "symbol_native": "Kč",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "CZK",
      "name_plural": "Czech Republic korunas"
    },
    "DJF": {
      "symbol": "DJF",
      "name": "Djiboutian Franc",
      "symbol_native": "Fdj",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "DJF",
      "name_plural": "Djiboutian francs"
    },
    "DKK": {
      "symbol": "DKK",
      "name": "Danish Krone",
      "symbol_native": "kr",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "DKK",
      "name_plural": "Danish kroner"
    },
    "DOP": {
      "symbol": "DOP",
      "name": "Dominican Peso",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "DOP",
      "name_plural": "Dominican pesos"
    },
    "DZD": {
      "symbol": "DZD",
      "name": "Algerian Dinar",
      "symbol_native": "د.ج.\u200F",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "DZD",
      "name_plural": "Algerian dinars"
    },
    "EGP": {
      "symbol": "EGP",
      "name": "Egyptian Pound",
      "symbol_native": "ج.م.\u200F",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "EGP",
      "name_plural": "Egyptian pounds"
    },
    "ERN": {
      "symbol": "ERN",
      "name": "Eritrean Nakfa",
      "symbol_native": "Nfk",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "ERN",
      "name_plural": "Eritrean nakfas"
    },
    "ETB": {
      "symbol": "ETB",
      "name": "Ethiopian Birr",
      "symbol_native": "ብር",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "ETB",
      "name_plural": "Ethiopian birrs"
    },
    "EUR": {
      "symbol": "\u20AC",
      "name": "Euro",
      "symbol_native": "\u20AC",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "EUR",
      "name_plural": "euros"
    },
    "GBP": {
      "symbol": "£",
      "name": "British Pound Sterling",
      "symbol_native": "£",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "GBP",
      "name_plural": "British pounds sterling"
    },
    "GEL": {
      "symbol": "GEL",
      "name": "Georgian Lari",
      "symbol_native": "GEL",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "GEL",
      "name_plural": "Georgian laris"
    },
    "GHS": {
      "symbol": "GHS",
      "name": "Ghanaian Cedi",
      "symbol_native": "GHS",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "GHS",
      "name_plural": "Ghanaian cedis"
    },
    "GNF": {
      "symbol": "GNF",
      "name": "Guinean Franc",
      "symbol_native": "FG",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "GNF",
      "name_plural": "Guinean francs"
    },
    "GTQ": {
      "symbol": "GTQ",
      "name": "Guatemalan Quetzal",
      "symbol_native": "Q",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "GTQ",
      "name_plural": "Guatemalan quetzals"
    },
    "GYD": {
      "symbol": "GYD",
      "name": "Guyanaese Dollar",
      "symbol_native": "GYD",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "GYD",
      "name_plural": "Guyanaese dollars"
    },
    "HKD": {
      "symbol": "HK$",
      "name": "Hong Kong Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "HKD",
      "name_plural": "Hong Kong dollars"
    },
    "HNL": {
      "symbol": "HNL",
      "name": "Honduran Lempira",
      "symbol_native": "L",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "HNL",
      "name_plural": "Honduran lempiras"
    },
    "HRK": {
      "symbol": "HRK",
      "name": "Croatian Kuna",
      "symbol_native": "kn",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "HRK",
      "name_plural": "Croatian kunas"
    },
    "HUF": {
      "symbol": "HUF",
      "name": "Hungarian Forint",
      "symbol_native": "Ft",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "HUF",
      "name_plural": "Hungarian forints"
    },
    "IDR": {
      "symbol": "IDR",
      "name": "Indonesian Rupiah",
      "symbol_native": "Rp",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "IDR",
      "name_plural": "Indonesian rupiahs"
    },
    "ILS": {
      "symbol": "\u20AA",
      "name": "Israeli New Sheqel",
      "symbol_native": "\u20AA",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "ILS",
      "name_plural": "Israeli new sheqels"
    },
    "INR": {
      "symbol": "\u20B9",
      "name": "Indian Rupee",
      "symbol_native": "\u20B9",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "INR",
      "name_plural": "Indian rupees"
    },
    "IQD": {
      "symbol": "IQD",
      "name": "Iraqi Dinar",
      "symbol_native": "د.ع.\u200F",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "IQD",
      "name_plural": "Iraqi dinars"
    },
    "IRR": {
      "symbol": "IRR",
      "name": "Iranian Rial",
      "symbol_native": "﷼",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "IRR",
      "name_plural": "Iranian rials"
    },
    "ISK": {
      "symbol": "ISK",
      "name": "Icelandic Króna",
      "symbol_native": "kr",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "ISK",
      "name_plural": "Icelandic krónur"
    },
    "JMD": {
      "symbol": "JMD",
      "name": "Jamaican Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "JMD",
      "name_plural": "Jamaican dollars"
    },
    "JOD": {
      "symbol": "JOD",
      "name": "Jordanian Dinar",
      "symbol_native": "د.أ.\u200F",
      "decimal_digits": 3,
      "rounding": 0.0,
      "code": "JOD",
      "name_plural": "Jordanian dinars"
    },
    "JPY": {
      "symbol": "¥",
      "name": "Japanese Yen",
      "symbol_native": "￥",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "JPY",
      "name_plural": "Japanese yen"
    },
    "KES": {
      "symbol": "KES",
      "name": "Kenyan Shilling",
      "symbol_native": "Ksh",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "KES",
      "name_plural": "Kenyan shillings"
    },
    "KHR": {
      "symbol": "KHR",
      "name": "Cambodian Riel",
      "symbol_native": "៛",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "KHR",
      "name_plural": "Cambodian riels"
    },
    "KMF": {
      "symbol": "KMF",
      "name": "Comorian Franc",
      "symbol_native": "CF",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "KMF",
      "name_plural": "Comorian francs"
    },
    "KRW": {
      "symbol": "\u20A9",
      "name": "South Korean Won",
      "symbol_native": "\u20A9",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "KRW",
      "name_plural": "South Korean won"
    },
    "KWD": {
      "symbol": "KWD",
      "name": "Kuwaiti Dinar",
      "symbol_native": "د.ك.\u200F",
      "decimal_digits": 3,
      "rounding": 0.0,
      "code": "KWD",
      "name_plural": "Kuwaiti dinars"
    },
    "KZT": {
      "symbol": "KZT",
      "name": "Kazakhstani Tenge",
      "symbol_native": "\u20B8",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "KZT",
      "name_plural": "Kazakhstani tenges"
    },
    "LBP": {
      "symbol": "LBP",
      "name": "Lebanese Pound",
      "symbol_native": "ل.ل.\u200F",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "LBP",
      "name_plural": "Lebanese pounds"
    },
    "LKR": {
      "symbol": "LKR",
      "name": "Sri Lankan Rupee",
      "symbol_native": "රු.",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "LKR",
      "name_plural": "Sri Lankan rupees"
    },
    "LRD": {
      "symbol": "LRD",
      "name": "Liberian Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "LRD",
      "name_plural": "Liberian dollars"
    },
    "LTL": {
      "symbol": "LTL",
      "name": "Lithuanian Litas",
      "symbol_native": "Lt",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "LTL",
      "name_plural": "Lithuanian litai"
    },
    "LVL": {
      "symbol": "LVL",
      "name": "Latvian Lats",
      "symbol_native": "Ls",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "LVL",
      "name_plural": "Latvian lati"
    },
    "LYD": {
      "symbol": "LYD",
      "name": "Libyan Dinar",
      "symbol_native": "د.ل.\u200F",
      "decimal_digits": 3,
      "rounding": 0.0,
      "code": "LYD",
      "name_plural": "Libyan dinars"
    },
    "MAD": {
      "symbol": "MAD",
      "name": "Moroccan Dirham",
      "symbol_native": "د.م.\u200F",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "MAD",
      "name_plural": "Moroccan dirhams"
    },
    "MDL": {
      "symbol": "MDL",
      "name": "Moldovan Leu",
      "symbol_native": "MDL",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "MDL",
      "name_plural": "Moldovan lei"
    },
    "MGA": {
      "symbol": "MGA",
      "name": "Malagasy Ariary",
      "symbol_native": "MGA",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "MGA",
      "name_plural": "Malagasy Ariaries"
    },
    "MKD": {
      "symbol": "MKD",
      "name": "Macedonian Denar",
      "symbol_native": "MKD",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "MKD",
      "name_plural": "Macedonian denari"
    },
    "MMK": {
      "symbol": "MMK",
      "name": "Myanma Kyat",
      "symbol_native": "K",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "MMK",
      "name_plural": "Myanma kyats"
    },
    "MOP": {
      "symbol": "MOP",
      "name": "Macanese Pataca",
      "symbol_native": "MOP",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "MOP",
      "name_plural": "Macanese patacas"
    },
    "MUR": {
      "symbol": "MUR",
      "name": "Mauritian Rupee",
      "symbol_native": "MUR",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "MUR",
      "name_plural": "Mauritian rupees"
    },
    "MXN": {
      "symbol": "MX$",
      "name": "Mexican Peso",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "MXN",
      "name_plural": "Mexican pesos"
    },
    "MYR": {
      "symbol": "MYR",
      "name": "Malaysian Ringgit",
      "symbol_native": "RM",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "MYR",
      "name_plural": "Malaysian ringgits"
    },
    "MZN": {
      "symbol": "MZN",
      "name": "Mozambican Metical",
      "symbol_native": "MTn",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "MZN",
      "name_plural": "Mozambican meticals"
    },
    "NAD": {
      "symbol": "NAD",
      "name": "Namibian Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "NAD",
      "name_plural": "Namibian dollars"
    },
    "NGN": {
      "symbol": "NGN",
      "name": "Nigerian Naira",
      "symbol_native": "\u20A6",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "NGN",
      "name_plural": "Nigerian nairas"
    },
    "NIO": {
      "symbol": "NIO",
      "name": "Nicaraguan Córdoba",
      "symbol_native": "C$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "NIO",
      "name_plural": "Nicaraguan córdobas"
    },
    "NOK": {
      "symbol": "NOK",
      "name": "Norwegian Krone",
      "symbol_native": "kr",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "NOK",
      "name_plural": "Norwegian kroner"
    },
    "NPR": {
      "symbol": "NPR",
      "name": "Nepalese Rupee",
      "symbol_native": "नेरू",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "NPR",
      "name_plural": "Nepalese rupees"
    },
    "NZD": {
      "symbol": "NZ$",
      "name": "New Zealand Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "NZD",
      "name_plural": "New Zealand dollars"
    },
    "OMR": {
      "symbol": "OMR",
      "name": "Omani Rial",
      "symbol_native": "ر.ع.\u200F",
      "decimal_digits": 3,
      "rounding": 0.0,
      "code": "OMR",
      "name_plural": "Omani rials"
    },
    "PAB": {
      "symbol": "PAB",
      "name": "Panamanian Balboa",
      "symbol_native": "B\/.",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "PAB",
      "name_plural": "Panamanian balboas"
    },
    "PEN": {
      "symbol": "PEN",
      "name": "Peruvian Nuevo Sol",
      "symbol_native": "S\/.",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "PEN",
      "name_plural": "Peruvian nuevos soles"
    },
    "PHP": {
      "symbol": "PHP",
      "name": "Philippine Peso",
      "symbol_native": "\u20B1",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "PHP",
      "name_plural": "Philippine pesos"
    },
    "PKR": {
      "symbol": "PKR",
      "name": "Pakistani Rupee",
      "symbol_native": "\u20A8",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "PKR",
      "name_plural": "Pakistani rupees"
    },
    "PLN": {
      "symbol": "PLN",
      "name": "Polish Zloty",
      "symbol_native": "zł",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "PLN",
      "name_plural": "Polish zlotys"
    },
    "PYG": {
      "symbol": "PYG",
      "name": "Paraguayan Guarani",
      "symbol_native": "\u20B2",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "PYG",
      "name_plural": "Paraguayan guaranis"
    },
    "QAR": {
      "symbol": "QAR",
      "name": "Qatari Rial",
      "symbol_native": "ر.ق.\u200F",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "QAR",
      "name_plural": "Qatari rials"
    },
    "RON": {
      "symbol": "RON",
      "name": "Romanian Leu",
      "symbol_native": "RON",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "RON",
      "name_plural": "Romanian lei"
    },
    "RSD": {
      "symbol": "RSD",
      "name": "Serbian Dinar",
      "symbol_native": "дин.",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "RSD",
      "name_plural": "Serbian dinars"
    },
    "RUB": {
      "symbol": "RUB",
      "name": "Russian Ruble",
      "symbol_native": "руб.",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "RUB",
      "name_plural": "Russian rubles"
    },
    "RWF": {
      "symbol": "RWF",
      "name": "Rwandan Franc",
      "symbol_native": "FR",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "RWF",
      "name_plural": "Rwandan francs"
    },
    "SAR": {
      "symbol": "SAR",
      "name": "Saudi Riyal",
      "symbol_native": "ر.س.\u200F",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "SAR",
      "name_plural": "Saudi riyals"
    },
    "SDG": {
      "symbol": "SDG",
      "name": "Sudanese Pound",
      "symbol_native": "SDG",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "SDG",
      "name_plural": "Sudanese pounds"
    },
    "SEK": {
      "symbol": "SEK",
      "name": "Swedish Krona",
      "symbol_native": "kr",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "SEK",
      "name_plural": "Swedish kronor"
    },
    "SGD": {
      "symbol": "SGD",
      "name": "Singapore Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "SGD",
      "name_plural": "Singapore dollars"
    },
    "SOS": {
      "symbol": "SOS",
      "name": "Somali Shilling",
      "symbol_native": "SOS",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "SOS",
      "name_plural": "Somali shillings"
    },
    "STD": {
      "symbol": "STD",
      "name": "São Tomé and Príncipe Dobra",
      "symbol_native": "Db",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "STD",
      "name_plural": "São Tomé and Príncipe dobras"
    },
    "SYP": {
      "symbol": "SYP",
      "name": "Syrian Pound",
      "symbol_native": "ل.س.\u200F",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "SYP",
      "name_plural": "Syrian pounds"
    },
    "THB": {
      "symbol": "฿",
      "name": "Thai Baht",
      "symbol_native": "฿",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "THB",
      "name_plural": "Thai baht"
    },
    "TND": {
      "symbol": "TND",
      "name": "Tunisian Dinar",
      "symbol_native": "د.ت.\u200F",
      "decimal_digits": 3,
      "rounding": 0.0,
      "code": "TND",
      "name_plural": "Tunisian dinars"
    },
    "TOP": {
      "symbol": "TOP",
      "name": "Tongan Paʻanga",
      "symbol_native": "T$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "TOP",
      "name_plural": "Tongan paʻanga"
    },
    "TRY": {
      "symbol": "TRY",
      "name": "Turkish Lira",
      "symbol_native": "TL",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "TRY",
      "name_plural": "Turkish Lira"
    },
    "TTD": {
      "symbol": "TTD",
      "name": "Trinidad and Tobago Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "TTD",
      "name_plural": "Trinidad and Tobago dollars"
    },
    "TWD": {
      "symbol": "NT$",
      "name": "New Taiwan Dollar",
      "symbol_native": "NT$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "TWD",
      "name_plural": "New Taiwan dollars"
    },
    "TZS": {
      "symbol": "TZS",
      "name": "Tanzanian Shilling",
      "symbol_native": "TSh",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "TZS",
      "name_plural": "Tanzanian shillings"
    },
    "UAH": {
      "symbol": "UAH",
      "name": "Ukrainian Hryvnia",
      "symbol_native": "\u20B4",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "UAH",
      "name_plural": "Ukrainian hryvnias"
    },
    "UGX": {
      "symbol": "UGX",
      "name": "Ugandan Shilling",
      "symbol_native": "USh",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "UGX",
      "name_plural": "Ugandan shillings"
    },
    "USD": {
      "symbol": "$",
      "name": "US Dollar",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "USD",
      "name_plural": "US dollars"
    },
    "UYU": {
      "symbol": "UYU",
      "name": "Uruguayan Peso",
      "symbol_native": "$",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "UYU",
      "name_plural": "Uruguayan pesos"
    },
    "UZS": {
      "symbol": "UZS",
      "name": "Uzbekistan Som",
      "symbol_native": "UZS",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "UZS",
      "name_plural": "Uzbekistan som"
    },
    "VEF": {
      "symbol": "VEF",
      "name": "Venezuelan Bolívar",
      "symbol_native": "Bs.F.",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "VEF",
      "name_plural": "Venezuelan bolívars"
    },
    "VND": {
      "symbol": "\u20AB",
      "name": "Vietnamese Dong",
      "symbol_native": "\u20AB",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "VND",
      "name_plural": "Vietnamese dong"
    },
    "XAF": {
      "symbol": "FCFA",
      "name": "CFA Franc BEAC",
      "symbol_native": "FCFA",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "XAF",
      "name_plural": "CFA francs BEAC"
    },
    "XOF": {
      "symbol": "CFA",
      "name": "CFA Franc BCEAO",
      "symbol_native": "CFA",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "XOF",
      "name_plural": "CFA francs BCEAO"
    },
    "YER": {
      "symbol": "YER",
      "name": "Yemeni Rial",
      "symbol_native": "ر.ي.\u200F",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "YER",
      "name_plural": "Yemeni rials"
    },
    "ZAR": {
      "symbol": "ZAR",
      "name": "South African Rand",
      "symbol_native": "R",
      "decimal_digits": 2,
      "rounding": 0.0,
      "code": "ZAR",
      "name_plural": "South African rand"
    },
    "ZMK": {
      "symbol": "ZMK",
      "name": "Zambian Kwacha",
      "symbol_native": "ZK",
      "decimal_digits": 0,
      "rounding": 0.0,
      "code": "ZMK",
      "name_plural": "Zambian kwachas"
    }
  };
  
  
  /* TODO Missing Currencies:
     ANG, BSD, BTN, CLF, CUP, EEK, FJD, FKP, GIP, GMD, HTG, JEP, KGS, KPW, KYD,
     LAK, LSL, MNT, MRO, MTL, MVR, MWK, PGK, SBD, SCR, SHP, SLL, SRD, SVC, SZL,
     TJS, TMT, VUV, WST, XAG, XAU, XCD, "XDR", XPF, ZMW, ZWL
  */
  return fiatCurrencies;
});
