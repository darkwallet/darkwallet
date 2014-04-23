'use strict';

define(['./module', 'bitcoinjs-lib', 'util/btc', 'moment'], function (filters, Bitcoin, BtcUtils, moment) {

var convert = Bitcoin.convert;

// Filter for presenting a block height as date
filters.filter('heightToDate', function() {
  return function(input, format) {
    var m = moment(BtcUtils.heightToTimestamp(input));
    if (format === 'calendar') {
      return m.calendar();
    }
    return m.fromNow();
  };
});


// Filter for presenting a byte array as hex
filters.filter('bytesToHex', function() {
  return function(input) {
    return convert.bytesToHex(input);
  };
});

// Filter for presenting an uncompressed key as compressed address hash
filters.filter('bytesToAddressHash', function() {
  return function(input) {
    if (input.length == 65 || input.length == 33) {
        var hashed = Bitcoin.crypto.hash160(input);
        var address = Bitcoin.Address(hashed);
        return address.toString();
    } else {
        return convert.bytesToHex(input);
    }
  };
});


});
