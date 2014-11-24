var ss = require('sdk/simple-storage');

var storage = {
    local: {
        get: function(keys, callback) {
            if (!keys) {
                callback(ss.storage);
            } else if (typeof keys === 'string') {
                callback(ss.storage[keys]);
            } else if (Array.isArray(keys)) {
                callback(keys.map(function(key) {
                    return ss.storage[key];
                }));
            } else if (typeof keys === 'object') {
                var _keys = Object.keys(keys);
                callback(_keys.map(function(key) {
                    return ss.storage[key] || keys[key];
                }));
            }
        },
        getBytesInUse: function(keys, callback) {
            if (keys) {
                console.error("Firefox has no support for individual bytes in use queries.");
            }
            callback(ss.quotaUsage * 5242880);
        },
        set: function(items, callback) {
            var keys = Object.keys(items);
            keys.forEach(function(key) {
                ss.storage[key] = items[key];
            });
            callback ? callback() : null;
        },
        remove: function(keys, callback) {
            if (typeof keys === 'string') {
                delete ss.storage[keys];
            } else if (Array.isArray(keys)) {
                keys.forEach(function(key) {
                    delete ss.storage[key];
                });
            }
            callback ? callback() : null;
        },
        clear: function(callback) {
            ss.storage = {};
            callback ? callback() : null;
        },
        QUOTA_BYTES: 5242880
    }
};

module.exports = storage;