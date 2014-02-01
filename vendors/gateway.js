function write_to_screen(data) {
    console.log(data);
}

function GatewayClient(connect_uri, handle_connect)
{
    var self = this;
    this.handler_map = {};
    this.websocket = new WebSocket(connect_uri);
    this.websocket.onopen = function(evt) {
        handle_connect();
    };
    this.websocket.onclose = function(evt) {
        self.on_close(evt);
    };
    this.websocket.onerror = function(evt) {
        self.on_error(evt);
    };
    this.websocket.onmessage = function(evt) {
        self.on_message(evt);
    };
}

GatewayClient.prototype.on_close = function(evt)
{
    write_to_screen("DISCONNECTED");
}
GatewayClient.prototype.on_error = function(evt)
{
    write_to_screen('<span style="color: red;">ERROR:</span> ' + evt.data);
}
GatewayClient.prototype.on_message = function(evt)
{
    response = JSON.parse(evt.data);
    id = response["id"];
    handler = this.handler_map[id];
    handler(response);
}

function random_integer()
{
    return Math.floor((Math.random() * 4294967296)); 
}

GatewayClient.prototype.make_request = function(command, params, handler)
{
    id = random_integer();
    var request = {
        "id": id,
        "command": command,
        "params": params
    };
    message = JSON.stringify(request);
    write_to_screen("SENT: " + message); 
    this.websocket.send(message);
    this.handler_map[id] = handler;
}

GatewayClient.prototype.fetch_last_height = function(handle_fetch)
{
    this.make_request("fetch_last_height", [], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
}

GatewayClient.prototype.fetch_transaction = function(tx_hash, handle_fetch)
{
    this.make_request("fetch_transaction", [tx_hash], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
}

GatewayClient.prototype.fetch_history = function(address, handle_fetch)
{
    this.make_request("fetch_history", [address], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
}

