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
    this.connections = store.init('connections', {servers: [{name: 'unsystem', type: 'gateway', address: 'ws://gateway.unsystem.net:8888'}],
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
}


/**
 * Set the selected server
 * @param {Int} idx server index
 */
Connections.prototype.setSelectedServer = function(idx) {
    this.selectedServer = idx;
    this.connections.selectedServer = idx;
    this.store.save();
}

/**
 * Set always connect
 * @param {Bool} alwaysConnect Always connect to the server when starting application
 */
Connections.prototype.setAlwaysConnect = function(alwaysConnect) {
    this.alwaysConnect = alwaysConnect;
    this.connections.alwaysConnect = alwaysConnect;
    this.store.save();
}

return Connections;

})
