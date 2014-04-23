'use strict';

define(['./module', 'bitcoinjs-lib', 'util/btc', 'moment', 'darkwallet'], function (filters, Bitcoin, BtcUtils, moment, DarkWallet) {

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
        var identity = DarkWallet.getIdentity();
        var hashed = Bitcoin.crypto.hash160(input);
        var address = Bitcoin.Address(hashed, identity.wallet.versions.address);
        return address.toString();
    } else {
        return convert.bytesToHex(input);
    }
  };
});


});
