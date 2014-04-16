define(['backend/port', 'chrome'], function (Port, chrome) {
  'use strict';

  describe('Core service api', function() {

    beforeEach(function() {
      chrome.runtime.clear();
      // TODO: How to clear the Ports cache here?
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
