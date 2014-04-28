'use strict';

/*
 * @fileOverview Identity connections to servers.
 */

define(function() {

/**
 * Connections class.
 * @param {Object} store Store for the object.
 * @constructor
 */
function Connections(store, identity) {
    this.store = store;

    var defaultServers = {'bitcoin': [{name: 'unsystem', type: 'gateway', address: 'wss://gateway.unsystem.net'}],
                          'testnet': [{name: 'unsystem testnet', type: 'gateway', address: 'ws://85.25.198.97:8888'}]};

    this.connections = store.init('connections', {servers: defaultServers[store.get('network')],
                                              selectedServer: 0,
                                              alwaysConnect: 0});
    
    this.servers = this.connections.servers;
    this.selectedServer = this.connections.selectedServer;
    this.alwaysConnect = this.connections.alwaysConnect;
}

/**
 * Add server
 * @param {String} name Server name
 * @param {String} address Full server address
 * @param {String} type Server type (only gateway accepted for now)
 */
Connections.prototype.addServer = function(name, address, type) {
    if (!type) type = 'gateway';
    this.servers.push({name: name, type: type, address: address});
    this.store.save();
};


/**
 * Set the selected server
 * @param {Number} idx server index
 */
Connections.prototype.setSelectedServer = function(idx) {
    this.selectedServer = idx;
    this.connections.selectedServer = idx;
    console.log("[model] selectedServer", idx);
    this.store.save();
};

/**
 * Set always connect
 * @param {Boolean} alwaysConnect Always connect to the server when starting application
 */
Connections.prototype.setAlwaysConnect = function(alwaysConnect) {
    this.alwaysConnect = alwaysConnect;
    this.connections.alwaysConnect = alwaysConnect;
    this.store.save();
};

Connections.prototype.getServer = function(idx) {
  return this.servers[idx];
}

return Connections;

});
