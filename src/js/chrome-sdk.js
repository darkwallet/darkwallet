if (typeof chrome !== 'undefined') {
    // Do nothing
} else if (!self.port) { // Not inside content script

    var worker = {
        port: {
            on: function(name, cb) {
                window.addEventListener(name, function(event) {
                    cb(event.detail);
                });
            },
            listeners: {
                connect: [],
                disconnect: [],
                message: []
            },
            emit: function(name, data) {
                var evt = document.createEvent("CustomEvent");
                evt.initCustomEvent(name, true, false, data);
                window.dispatchEvent(evt);
            }
        }
    };

    ['connect', 'disconnect', 'message'].forEach(function(eventName) {
        window.addEventListener(eventName, function(event) {
            worker.port.listeners[eventName].forEach(function(listener) {
                listener(data);
            });
        });
    });

    var backgroundCall = function(func) {
        return function() {
            var args = Array.prototype.slice.call(arguments);
            var callId = Math.random().toString(36);
            args.some(function(arg, i) {
                if (typeof arg === "function") {
                    args[i] = "_callback_";
                    worker.port.on('callback', function(response) {
                        if (response.callId === callId) {
                            console.log(response)
                            arg(response.data);
                        }
                    });
                    return true; //break
                }
            });
            worker.port.emit('execute', {
                name: func,
                args: args,
                callId: callId
            });
        };
    };

    var activeAPI = function(componentName, component) {
        for (var key in component) {
            if (!component[key]) {
                component[key] = backgroundCall(componentName + '.' + key);
            } else {
                activeAPI(componentName + '.' + key, component[key]);
            }
        }
    }

    var browserAction = {
        onClicked: null,
        setTitle: null,
        getTitle: null,
        setIcon: null,
        setPopup: null,
        getPopup: null,
        setBadgeText: null,
        getBadgeText: null,
        setBadgeBackgroundColor: null,
        getBadgeBackgroundColor: null,
        enable: null,
        disable: null
    };

    var storage = {
        local: {
            get: null,
            getBytesInUse: null,
            set: null,
            remove: null,
            clear: null,
            QUOTA_BYTES: null
        }
    };

    var tabs = {
        getCurrent: null,
        update: null,
        create: null
    };

    window.chrome = {
        browserAction: browserAction,
        storage: storage,
        tabs: tabs
    };

    activeAPI('chrome', window.chrome);

    var backgroundListenCalls = function() {
        worker.port.on('execute', function(data) {
            if (!/background\./.test(data.name)) {
                return;
            }
            console.log(data);
            var func = window.api;
            data.name.split('.').splice(1).forEach(function(chunck) {
                func = func[chunck];
            });
            var args = data.args.slice(0);
            args.some(function(arg, i) {
                if (arg === '_callback_') {
                    args[i] = function(_data) {
                        data.data = _data;
                        worker.port.emit('callback', data);
                    };
                    return true;
                }
            });
            func.apply(this, args);
        });
        return window;
    };

    var background = (function() {
        if (!window.contentScriptOptions) { // backend
            return backgroundListenCalls();
        }
        var background = {api: {}};
        var api = window.contentScriptOptions.api;
        api.forEach(function(func) {
            background.api[func] = backgroundCall('background.' + func);
        });
        return background;
    })();

    window.chrome.extension = {
        getBackgroundPage: function() {
            return background;
        }
    };

    window.chrome.runtime = {
        // This will be called when creating a service
        onConnect: {
            addListener: function(cb) {
                worker.port.on('connect', function(data) {
                    var port = JSON.parse(JSON.stringify(data.port)); // In backend port is an unmutable object
                    port.onDisconnect = {
                        addListener: function(cb) {
                            worker.port.on('disconnect', function(data) {
                                if (data.id === port._id_) cb(data.port);
                            });
                        }
                    };
                    port.onMessage = {
                        addListener: function(cb) {
                            worker.port.on('message', function(data) {
                                if (data.id === port._id_) cb(data.message);
                            });
                        }
                    };
                    port.postMessage = function(data) {
                        worker.port.emit("message", {
                            id: port._id_,
                            message: data
                        });
                    };
                    return cb(port);
                });
            }
        },
        // Call this to trigger the onConnect
        connect: function(port) {
            port._id_ = Math.random().toString(36);
            port.onDisconnect = {
                addListener: function(cb) {
                    worker.port.on('disconnect', function(data) {
                        if (data.id === port._id_) cb(data.port);
                    });
                }
            };
            port.onMessage = {
                addListener: function(cb) {
                    worker.port.on('message', function(data) {
                        if (data.id === port._id_) cb(data.message);
                    });
                }
            };
            port.postMessage = function(data) {
                worker.port.emit("message", {
                    id: port._id_,
                    message: data
                });
            };
            worker.port.emit('connect', {
                port: port
            });
            return port;
        },
        // Call this to trigger the onDisconnect
        disconnect: function(port) {
            worker.port.emit("disconnect", {
                port: port
            });
        },
        // Call this to trigger onMessage
        sendMessage: function(data) {
            worker.port.emit("message", {
                message: data
            });
        },
        onMessage: {
            addListener: function(cb) {
                worker.port.on("message", function(data) {
                    if (!data.id) cb(data.message);
                });
            }
        }
    };

} else {

    (function(worker) {
        ['connect', 'disconnect', 'message', 'execute', 'callback'].forEach(function(eventName) {
            // the data is available in the detail property of the event
            window.addEventListener(eventName, function(event) {
                worker.port.emit(eventName, event.detail);
            });
            worker.port.on(eventName, function(data) {
                var evt = document.createEvent("CustomEvent");
                evt.initCustomEvent(eventName, true, false, cloneInto(data, unsafeWindow));
                window.dispatchEvent(evt);
            });
        });
        window.addEventListener('backgroundReady', function() {
          worker.port.emit('backgroundReady', Object.keys(unsafeWindow.api));
        });
    })(self);

    unsafeWindow.contentScriptOptions = cloneInto(self.options, unsafeWindow);

}