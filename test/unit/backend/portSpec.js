'use strict';

define(['testUtils'], function(testUtils) {
  
  describe('Core service api', function() {
    
    var chrome, Port;

    beforeEach(function(done) {
      //testUtils.stub('chrome', {
      chrome = {
        runtime: {
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
        }
      //});
      };
      window.chrome = chrome;
      
      testUtils.loadWithCurrentStubs('backend/port', function(port) {
        //chrome = require('chrome');
        Port = port;
        chrome.runtime.clear();
        // TODO: How to clear the Ports cache here?
        done();
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    });

    it('Creates a service and registers callbacks', function() {
      // Port server messages
      var msgTriggered = [];
      // Port client messages
      var msgReceived = [];

      var connectTriggered = 0;
      var disconnectTriggered = 0;

      var onMessage = function(data) {msgTriggered.push(data);};
      var onConnect = function() {connectTriggered += 1;};
      var onDisconnect = function() {disconnectTriggered += 1};

      Port.listen('wallet', onMessage, onConnect, onDisconnect);

      var port = chrome.runtime.initPort({name: 'wallet'});

      expect(connectTriggered).toBe(1);
      expect(chrome.runtime.received.length).toBe(1);
      expect(chrome.runtime.received[0]).toEqual({type: 'portConnected'});

      chrome.runtime.postMessage('foo');
      expect(msgTriggered.length).toBe(1);
      expect(msgTriggered[0]).toBe('foo');

      chrome.runtime.closePort(port);
      expect(disconnectTriggered).toBe(1);
    });

    it('Sends a message to a port', function() {
      Port.listen('wallet2');

      var port = chrome.runtime.initPort({name: 'wallet2'});

      chrome.runtime.received = [];
      Port.post('wallet2', {text: 'foo'});

      expect(chrome.runtime.received.length).toBe(1);
      expect(chrome.runtime.received[0]).toEqual({text: 'foo'});
    });

    it('Connects to child service', function() {
      var connectTriggered = 0;
      var received = [];
      var onConnect = function() {connectTriggered += 1;};
      var onMessage = function(data) {received.push(data)};

      Port.listen('wallet3', null, onConnect);

      Port.connect('wallet3', onMessage)

      // Check connect was triggered
      expect(connectTriggered).toBe(1);

      // Check we received the portConnected message
      expect(received.length).toBe(1);
      expect(received[0]).toEqual({type: 'portConnected'});
    });

    it('Connects to child service and sends a message', function() {
      var connectTriggered = 0;
      var received = [];
      var onConnect = function() {connectTriggered += 1;};
      var onMessage = function(data) {received.push(data)};

      Port.listen('wallet4', null, onConnect);

      Port.connect('wallet4', onMessage)

      expect(connectTriggered).toBe(1);

      // reset received messages
      received = [];

      Port.post('wallet4', {text: 'bar'});

      // Check we received the message
      expect(received.length).toBe(1);
      expect(received[0]).toEqual({text: 'bar'});
    });

  });
 
});
