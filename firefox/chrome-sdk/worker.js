var self = require("sdk/self");
var chrome;

var workers = [];
var backgroundWorker;

var init = function(_chrome) {
    chrome = _chrome;
    backgroundWorker = require("sdk/page-worker").Page({
        contentScript: "\
      document.onreadystatechange = function () {\
        if (document.readyState == 'interactive') {\
          self.port.emit('backgroundAPI', Object.keys(unsafeWindow));\
        }\
      };",
        contentScriptFile: self.data.url("chrome-sdk.js"),
        contentURL: self.data.url("html/background.html"),
        contentScriptWhen: 'start'
    });
    activeChromeAPI(backgroundWorker);

    backgroundWorker.port.on('backgroundAPI', function(api) {
        require("sdk/page-mod").PageMod({
            include: self.data.url("*"),
            contentScriptFile: self.data.url("chrome-sdk.js"),
            contentScriptWhen: 'start',
            contentScriptOptions: {
                api: api
            },
            onAttach: function(w) {
                workers.push(w);
                activeChromeAPI(w);
                attachToBackground(w);
            }
        });
    });
};

function activeChromeAPI(worker) {
    worker.port.on('execute', function(data) {
        if (!/chrome\./.test(data.name)) {
            return;
        }
        console.log(data);
        var func = chrome;
        data.name.split('.').splice(1).forEach(function(chunck) {
            func = func[chunck];
        });
        data.args.some(function(arg, i) {
            if (arg === '_callback_') {
                data.args[i] = function(_data) {
                    data.data = _data;
                    worker.port.emit('callback', data);
                };
                return true; //break
            }
        });
        func.apply(this, data.args);
    });
}

function attachToBackground(worker) {
    worker.port.on('connect', function(data) {
        if (data.origin === 'backend') {
            return;
        }

        var id = data.port._id_;
        worker.port.on('message', function(data) {
            if (data.id === id && data.origin !== 'backend') {
                data.origin = 'backend';
                backgroundWorker.port.emit('message', data);
            }
        });
        backgroundWorker.port.on('message', function(data) {
            if (data.id === id && data.origin !== 'backend') {
                data.origin = 'backend';
                worker.port.emit('message', data);
            }
        });
        data.origin = 'backend';
        backgroundWorker.port.emit('connect', data);
    });
    worker.port.on('execute', function(data) {
        if (/background\./.test(data.name)) {
            backgroundWorker.port.emit('execute', data);
        }
    });
    backgroundWorker.port.on('callback', function(data) {
        worker.port.emit('callback', data);
    });
}

module.exports = {
    init: init
};