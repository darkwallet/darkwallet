define(function () {
    var Services = {
        /*
         * Connect to given service
         * @param {String} name Service name
         * @param {Function} onMessage Message callback
         * @param {Function} onConnect Connect callback
         * @param {Function} onDisconnect Disconnect callback
         * returns a chrome.runtime.Port.
         */
        connect: function(name, onMessage, onConnect, onDisconnect) {
            var port = chrome.runtime.connect({name: name});
            onMessage ? port.onMessage.addListener(onMessage) : null;
            onConnect ? port.onConnect.addListener(onConnect) : null;
            onDisconnect ? port.onDisconnect.addListener(onDisconnect) : null;
            return port;
        },

        /*
         * Connect to given service and register destruction with
         * angular scope, aimed at controllers.
         * @param {String} name Service name
         * @param {Angular.Scope} scope Controller scope
         * @param {Function} onMessage Message callback
         * @param {Function} onConnect Connect callback
         * @param {Function} onDisconnect Disconnect callback
         * returns a chrome.runtime.Port.
         */
        connectNg: function(name, scope, onMessage, onConnect, onDisconnect) {
            var port = Services.connect(name, onMessage, onConnect, onDisconnect);
            scope.$on('$destroy', function () { port.disconnect(); });
            return port;
        }
    };
    return Services;
});
