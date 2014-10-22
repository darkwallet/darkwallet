'use strict';

define(['./module', 'bitcoinjs-lib', 'util/btc', 'moment', 'darkwallet'], function (filters, Bitcoin, BtcUtils, moment, DarkWallet) {

var convert = Bitcoin.convert;

// Filter for presenting a block height as date
filters.filter('heightToDate', function() {
  return function(input, format) {
    var m = moment(BtcUtils.heightToTimestamp(input, DarkWallet.service.wallet.blockDiff));
    if (format === 'calendar') {
      return m.calendar();
    }
    if (m.isAfter(Date.now()-60000)) {
        return 'Just now';
    }
    return m.fromNow();
  };
});


moment.lang('en', {
    relativeTime : {
        future: "in %s",
        past:   "%s ago",
        s:  "s",
        m:  "1 min",
        mm: "%d min",
        h:  "1 h",
        hh: "%d h",
        d:  "1 day",
        dd: "%d days",
        M : "a month",
        MM : "%d months",
        y : "a year",
        yy : "%d years"
    }
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
        var address = new Bitcoin.Address(hashed, identity.wallet.versions.address);
        return address.toString();
    } else {
        return convert.bytesToHex(input);
    }
  };
});


});
