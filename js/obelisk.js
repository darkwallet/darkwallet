/**
 * @fileOverview Obelisk protocol client for the Bitcoin cryptocurrency.
 * @see http://libbitcoin.dyne.org/obelisk/
 */


/**
 * ObeliskClient class constructor.
 * Manages connections to an Obelisk server.
 * @constructor
 */
function ObeliskClient() {
  this.nonce = 0;
  this.initWebSocket('ws://85.25.198.97:8888');
};


/**
 * Tests ObeliskClient methods when a new WebSocket is opened:
 *  - getHistory
 *  - getLastHeight
 *  - subscribeAddress
 */
ObeliskClient.prototype.test = function() {

  this.getHistory('1Fufjpf9RM2aQsGedhSpbSCGRHrmLMJ7yY', function(res) {
    var rows = res[0],
        balance = 0;
    for (var idx = 0, entry; entry = rows[idx]; idx++) {
      if (entry[6] == 0xffffffff) {
        balance += entry[3];
      }
    }
    console.log('History arrived: ', res, 'balance', balance, res.length);
  });

  this.getLastHeight(function(res) {
    console.log('Height arrived: ', res);
  });

  this.subscribeAddress('1dice8EMZmqKvrGE4Qc9bUFf9PX3xaYDp', function(res) {
    console.log('Subscribe ok: ', res);
  });
};


/**
 * Initializes WebSocket communications with the Obelisk server.
 * @param {string} url WebSocket url of the server.
 */
ObeliskClient.prototype.initWebSocket = function(url) {
  var self = this,
      ws   = new WebSocket(url);

  ws.onopen = function(event) {
    self.test(event);
  };

  ws.onmessage = function(event) {
    self.onMessage(event);
  };

  this.socket = ws;
  this.callbacks = {};
};


/**
 * Sends a command to the server.
 * @param {string} command Command to send to the server.
 * @param {*} data Extra data to be sent with message.
 * @param {Function} success Success callback function.
 * @param {Function} error Error callback function.
 */
ObeliskClient.prototype.send = function(command, data, success, error) {
  this.nonce += 1;
  var msg = {
    'command': command,
    'id': this.nonce
  };
  if (data) {
    msg['data'] = data;
  }

  // TODO: Use constants for CALLBACK_SUCCESS = 0 and CALLBACK_ERROR = 1.
  this.callbacks[this.nonce] = [success, error];

  this.socket.send(JSON.stringify(msg));
};


/**
 * Handles event messages arriving from the server.
 * @param {Event} event Incoming event object.
 */
ObeliskClient.prototype.onMessage = function(event) {
  var msg = JSON.parse(event.data);
  var callback = this.callbacks[msg.id];

  if (callback) {
    var callbackSuccess = callback[0];
    if (callbackSuccess) {
      callbackSuccess(msg.result);
    }
    delete callback;
  } else {
    console.log('unhandled message', msg);
  }
};


/**
 * Sends request for the last height.
 * @param {Function} success Success callback function.
 * @param {Function} error Error callback function.
 */
ObeliskClient.prototype.getLastHeight = function(success, error) {
  this.send('fetch_last_height', false, success, error);
};


/**
 * Sends request for history of a bitcoin address.
 * @param {string} bitcoinAddress Bitcoin address to lookup history for.
 * @param {Function} success Success callback function.
 * @param {Function} error Error callback function.
 */
ObeliskClient.prototype.getHistory = function(bitcoinAddress, success, error) {
  this.send('fetch_history', {
    'address': bitcoinAddress
  }, success, error);
};


/**
 * Subscribes to notifications for a particular bitcoin address.
 * @param {string} bitcoinAddress Bitcoin address to lookup history for.
 * @param {Function} success Success callback function.
 * @param {Function} error Error callback function.
 */
ObeliskClient.prototype.subscribeAddress = function(bitcoinAddress, success,
    error) {
  this.send('subscribe_address', {
    'address': bitcoinAddress
  }, success, error);
};


// Create an instance of the Obelisk client.
var client = new ObeliskClient();
