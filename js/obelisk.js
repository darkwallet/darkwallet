/**
 * ObeliskClient
 *
 * Manages connections to an obelisk server.
 */
function ObeliskClient() {
    this.nonce = 0;
    this.initWebSocket("ws://localhost:9000")
};


/**
 * initWebSocket
 *
 * Initializes websocket communications
 *  * address: websocket url
 */
ObeliskClient.prototype.initWebSocket = function(address) {
    var self = this,
        ws   = new WebSocket(address);

    ws.onopen = function (event) {
        // get last height to test api
        self.getHeight(function(res){console.log('Height arrived', res)});
    }
    ws.onmessage = function(event) {self.onMessage(event)};
    this.socket = ws;
    this.callbacks = {};
}

/**
 * Send a command to the server.
 *  * command: command to send
 *  * data: extra data
 *  * success: success callback
 *  * error: error callback
 */
ObeliskClient.prototype.send = function(command, data, success, error) {
    this.nonce += 1;
    msg = {'command': command, 'id': this.nonce};
    if (data) {
        msg['data'] = data;
    }
    this.callbacks[this.nonce] = [success, error];

    this.socket.send(JSON.stringify(msg));
}

/**
 * Message arriving from the server
 *  * event: Incoming event
 */
ObeliskClient.prototype.onMessage = function(event) {
    var msg = JSON.parse(event.data);
    if (this.callbacks[msg.id] && this.callbacks[msg.id][0]) {
        this.callbacks[msg.id][0](msg.result);
        delete this.callbacks[msg.id];
    }
}

/**
 * Get last height
 *  * success: success callback
 *  * error: error callback
 */
ObeliskClient.prototype.getHeight = function(success, error) {
    this.send('getheight', false, success, error);
}

/**
 * Get history for an address
 *  * address: bitcoin address
 *  * success: success callback
 *  * error: error callback
 */
ObeliskClient.prototype.getHistory = function(address, success, error) {
    this.send("gethistory", address, success, error);
}

/**
 * Initialize an obelisk client
 */
client = new ObeliskClient()

