define(function() {
  var chrome_storage = {};
  chrome = {storage: {local: {
    get: function(key, callback) {
      // callback? callback(chrome_storage[key]) : null;
    },
    set: function(pairs, callback) {
      var key = Object.keys(pairs)[0];
      chrome_storage[key] = pairs[key];
      callback? callback() : null;
    },
    clear: function() {
      chrome_storage = {};
    },
    _: function() {
      return chrome_storage;
    }
  }}};
  return chrome;
});