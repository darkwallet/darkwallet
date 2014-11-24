var _tabs = require("sdk/tabs");

function Tab(_tab) {
    this.id = _tab.id;
    this.title = _tab.title;
    this.url = _tab.url;
}

function id2index(tabId) {
    var index;
    if (tabId) {
        for (let tab of _tabs) {
            if (tab.id == tabId) {
                index = tab.index;
                break;
            }
        }
    } else {
        index = _tabs.activeTab.index;
    }
    return index;
}

var tabs = {
    getCurrent: function(callback) {
        callback(new Tab(_tabs.activeTab));
    },
    update: function(tabId, updateProperties, callback) {
        var index = id2index(tabId);
        if (updateProperties.url) {
            _tabs[index].url = updateProperties.url;
        }
        if (updateProperties.active) {
            _tabs[index].activate();
        }
        callback ? callback(newTab(_tabs[index])) : null;
    },
    create: function(createProperties, callback) {
        openerId = createProperties.openerTabId;
        _tabs.open({
            url: createProperties.url
        });
        if (openerId) {
            var openerTab = _tabs[id2index(openerId)];
            _tabs.activeTab.on('close', function() {
                openerTab ? openerTab.activate() : null;
            });
        }
        callback ? callback(new Tab(_tabs.activeTab)) : null;
    }
};
module.exports = tabs;