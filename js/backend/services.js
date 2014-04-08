define(function () {
    var allPorts = {};
    var instances = {};
    var Services = {
        /*
         * Start the given service
         * @param {String} name Service name
         * @param {Function} onMessage Message callback
         * @param {Function} onConnect Connect callback
         * @param {Function} onDisconnect Disconnect callback
         */
        start: function(name, onMessage, onConnect, onDisconnect) {
            if (!allPorts.hasOwnProperty(name)) {
                allPorts[name] = [];
            }
            if (!instances.hasOwnProperty(name)) {
                instances[name] = {onConnect: onConnect, onDisconnect: onDisconnect};
            } else {
                throw Error("Service with duplicate name!");
            }
            chrome.runtime.onConnect.addListener(function(port) {
              if (port.name == name) {
                allPorts[name].push(port)
                // Call the onConnect callback
                onConnect ? onConnect(port) : null;
                // Register onMessage callback
                onMessage ? port.onMessage.addListener(onMessage) : null;
                port.onDisconnect.addListener(function(port) {
                  if (port.name == name) {
                    allPorts[name].splice(allPorts[name].indexOf(port), 1)
                    // Call the onDisconnect callback
                    onDisconnect ? onDisconnect(port) : null;
                  }
                });
                port.postMessage({type: 'portConnected'})
              }
            });
        },

        /*
         * Post data to all listeners on given Port
         * @param {String} name Service name
         * @param {Object} data Object to send to listeners
         */
        post: function(name, data) {
            if (allPorts.hasOwnProperty(name)) {
                allPorts[name].forEach(function(port) {
                    port.postMessage(data);
                });
            }
        },

        connect: function(name, onMessage) {
            if (!allPorts.hasOwnProperty(name)) {
                allPorts[name] = [];
            }
            var port = {postMessage: onMessage};
            allPorts[name].push(port);
            console.log("["+name+"] connect child service");
            instances[name].onConnect ? instances[name].onConnect(port) : null;
            return port;
        }
    };
    return Services;
});
