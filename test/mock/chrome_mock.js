'use strict';

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
  }}, runtime: {
    clear: function() {
       chrome.runtime.listeners = [];
       chrome.runtime.disconnectListeners = [];
       chrome.runtime.msgListeners = [];
       chrome.runtime.received = [];
    },
    listeners: [],
    disconnectListeners: [],
    msgListeners: [],
    received: [],
    // This will be called when creating a service
    onConnect: {
      addListener: function(cb) { chrome.runtime.listeners.push(cb) }
    },
    // Call this to trigger the onConnect
    initPort: function(port) {
      port.onDisconnect = {addListener: function(cb) {chrome.runtime.disconnectListeners.push(cb);}};
      port.onMessage = {addListener: function(cb) {chrome.runtime.msgListeners.push(cb);}};
      port.postMessage = function(data) { chrome.runtime.received.push(data) };
      chrome.runtime.listeners.forEach(function(listener) {listener(port)});
      return port;
    },
    // Call this to trigger the onDisconnect
    closePort: function(port) {
      chrome.runtime.disconnectListeners.forEach(function(listener) {listener(port)});
       
    },
    // Call this to trigger onMessage
    postMessage: function(data) {
      chrome.runtime.msgListeners.forEach(function(listener) {listener(data)});
    }
  }};
  return chrome;
});
