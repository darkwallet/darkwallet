define(function () {
    var allPorts = {};
    var Services = {
        start: function(name, onMessage, onConnect, onDisconnect) {
            if (!allPorts.hasOwnProperty(name)) {
                allPorts[name] = [];
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
              }
            });
        }
    };
    return Services;
});
