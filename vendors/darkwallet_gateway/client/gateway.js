/**
 * Client to connect to a darkwallet gateway.
 *
 * @param {String}   connect_uri Gateway websocket URI
 * @param {Function} handle_connect Callback to run when connected
 * @param {Function} handle_disconnect Callback to run when disconnected
 * @param {Function} handle_error Callback to run on errors (except connection errors go to handle_connect first parameter).
 *
 * handle_* callbacks take parameters as (error, data)
 */
function GatewayClient(connect_uri, handle_connect, handle_disconnect, handle_error) {
    var self = this;
    this.handler_map = {};
    this.connected = false;
    this.websocket = new WebSocket(connect_uri);
    this.websocket.onopen = function(evt) {
        self.connected = true;
        handle_connect();
    };
    this.websocket.onclose = function(evt) {
        self.connected = false;
        self.on_close(evt);
        if (handle_disconnect) {
            handle_disconnect(null, evt)
        }
    };
    this.websocket.onerror = function(evt) {
        // TODO: should probably disconnect
        if (!self.connected) {
            handle_connect(evt);
        } else if (handle_error) {
            handle_error(evt);
        }
    };
    this.websocket.onmessage = function(evt) {
        self._on_message(evt);
    };
}

/**
 * Get last height
 *
 * @param {Function} handle_fetch Callback to handle the returned height
 */
GatewayClient.prototype.fetch_last_height = function(handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_last_height", [], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

/**
 * Fetch transaction
 *
 * @param {String}   tx_hash Transaction identifier hash
 * @param {Function} handle_fetch Callback to handle the JSON object
 * representing the transaction 
 */
GatewayClient.prototype.fetch_transaction = function(tx_hash, handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_transaction", [tx_hash], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

/**
 * Fetch history
 *
 * @param {String}   address
 * @param {Function} handle_fetch Callback to handle the JSON object
 * representing the history of the address
 */
GatewayClient.prototype.fetch_history = function(address, height, handle_fetch) {
    height = height || 0;
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_history", [address, height], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

GatewayClient.prototype.fetch_stealth = function(
    prefix, handle_fetch, from_height)
{
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_stealth", [prefix, from_height],
        function(response) {
            handle_fetch(response["error"], response["result"][0]);
        });
};

/**
 * Subscribe
 *
 * @param {String}   address
 * @param {Function} handle_fetch Callback to handle subscription result
 * @param {Function} handle_update Callback to handle the JSON object
 * representing for updates
 */
GatewayClient.prototype.subscribe = function(
    address, handle_fetch, handle_update)
{
    var self = this;
    this.make_request("subscribe_address", [address], function(response) {
        handle_fetch(response["error"], response["result"][0]);
        if (handle_update) {
            self.handler_map["update." + address] = handle_update;
        }
    });
}

GatewayClient.prototype.fetch_block_header = function(index, handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_block_header", [index], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

GatewayClient.prototype.fetch_block_transaction_hashes = function(
    index, handle_fetch)
{
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_block_transaction_hashes", [index],
        function(response) {
            handle_fetch(response["error"], response["result"][0]);
        });
};

GatewayClient.prototype.fetch_spend = function(outpoint, handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_spend", [outpoint], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

GatewayClient.prototype.fetch_transaction_index = function(
    tx_hash, handle_fetch)
{
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_transaction_index", [tx_hash],
        function(response) {
            result = response["result"];
            handle_fetch(response["error"], result[0], result[1]);
        });
};

GatewayClient.prototype.fetch_block_height = function(blk_hash, handle_fetch)
{
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_block_height", [blk_hash], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

GatewayClient.prototype.broadcast_transaction = function(
    raw_tx, handle_fetch)
{
    GatewayClient._check_function(handle_fetch);

    this.make_request("broadcast_transaction", [raw_tx], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

/**
 * Renew
 *
 * @param {String}   address
 * @param {Function} handle_fetch Callback to handle subscription result
 * @param {Function} handle_update Callback to handle the JSON object
 * representing for updates
 */
GatewayClient.prototype.renew = function(address, handle_fetch, handle_update)
{
    var self = this;
    this.make_request("renew_address", [address], function(response) {
        handle_fetch(response["error"], response["result"][0]);
        if (handle_update) {
            self.handler_map["update."+address] = handle_update;
        }
    });
}

/**
 * Chan functionality
 */
GatewayClient.prototype.chan_post = function(section_name, thread_id, data, handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("chan_post", [section_name, thread_id, data], function(response) {
        if (handle_fetch)
            //console.log("raw chan post", response["result"]);
            handle_fetch(response["error"], response["result"]);
    });
};

GatewayClient.prototype.chan_list = function(section_name, handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("chan_list", [section_name], function(response) {
        if (handle_fetch)
            handle_fetch(response["error"], response["result"]);
    });
};


GatewayClient.prototype.chan_get = function(section_name, thread_id, handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("chan_get", [section_name, thread_id], function(response) {
        if (handle_fetch)
            handle_fetch(response["error"], response["result"]);
    });
};

GatewayClient.prototype.chan_subscribe = function(section_name, thread_id, handle_fetch, handle_update) {
    GatewayClient._check_function(handle_fetch);
    var self = this;
    this.make_request("chan_subscribe", [section_name, thread_id], function(response) {
        if (handle_fetch)
            handle_fetch(response["error"], response["result"]);
        if (handle_update) {
            self.handler_map["chan.update." + thread_id] = handle_update;
        }

    });
};
GatewayClient.prototype.chan_unsubscribe = function(section_name, thread_id, handle_fetch, handle_update) {
    GatewayClient._check_function(handle_fetch);
    var self = this;
    this.make_request("chan_unsubscribe", [section_name, thread_id], function(response) {
        if (handle_fetch)
            handle_fetch(response["error"], response["result"]);
        if (self.handler_map["chan.update." + thread_id]) {
            delete self.handler_map["chan.update." + thread_id]
        }
    });
};


/**
 * Ticker functionality
 *
 * @param {String} currency, like USD, EUR...
 * @param {Function} handle_fetch
 */

GatewayClient.prototype.fetch_ticker = function(currency, handle_fetch)
{
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_ticker", [currency], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

/**
 * Make requests to the server
 *
 * @param {String} command
 * @param {Array} params
 * @param {Function} handler 
 */
GatewayClient.prototype.make_request = function(command, params, handler) {
    GatewayClient._check_function(handler);

    var id = GatewayClient._random_integer();
    var request = {
        "id": id,
        "command": command,
        "params": params
    };
    var message = JSON.stringify(request);
    this.websocket.send(message);
    this.handler_map[id] = handler;
};

/**
 * Close event handler
 *
 * @param {Object} evt event
 */
GatewayClient.prototype.on_close = function(evt) {
};

/**
 * Error event handler
 *
 * @param {Object} evt event
 *
 * @throws {Object}
 */
GatewayClient.prototype.on_error = function(evt) {
    throw evt;
};

/**
 * After triggering message event, calls to the handler of the petition
 *
 * @param {Object} evt event
 * @private
 */
GatewayClient.prototype._on_message = function(evt) {
    this.on_message(evt)
    response = JSON.parse(evt.data);
    id = response.id;
    // Should be a separate map entirely. This is a hack.
    if (response.type == "update")
        id = "update." + response.address;
    if (response.type == "chan_update")
        id = "chan.update." + response.thread;
    // Prefer flat code over nested.
    if (!this.handler_map[id]) {
        console.log("Handler not found", id);
        return;
    }
    handler = this.handler_map[id];
    handler(response);
};

/**
 * Message event handler
 *
 * @param {Object} evt event
 */
GatewayClient.prototype.on_message = function(evt) {
}

/**
 * (Pseudo-)Random integer generator
 *
 * @return {Number} Random integer
 * @private
 */
GatewayClient._random_integer = function() {
    return Math.floor((Math.random() * 4294967296)); 
};

/**
 * Checks if param can be executed
 *
 * @param {Function} Function to be checked
 *
 * @throws {String} Parameter is not a function
 * @protected
 */
GatewayClient._check_function = function(func) {
    if (typeof func !== 'function') {
        throw "Parameter is not a function";
    }
};

