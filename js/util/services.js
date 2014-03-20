define(function () {
    var Services = {
        connect: function(name, onMessage) {
            var port = chrome.runtime.connect({name: name});
            onMessage ? port.onMessage.addListener(onMessage) : null;
            return port;
        }
    };
    return Services;
});
