define(function() {
  var chrome_storage = {};
  chrome = {storage: {local: {
    get: function(key, callback) {
      if (key === null) {
        value = chrome_storage;
      } else {
        // FIXME value = chrome_storage[key];
      }
      callback? callback(value) : null;
    },
    set: function(pairs, callback) {
      for(key in pairs) {
        chrome_storage[key] = pairs[key];
      }
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