var ActionButton = require('sdk/ui/button/action').ActionButton;
var panels = require("sdk/panel");
var self = require("sdk/self");

var tabs = require("./tabs");


var BrowserAction = function(details) {

    BrowserAction._button = ActionButton({
        id: self.name,
        label: details.default_title,
        icon: details.default_icon,
        onClick: showPanel
    });

    BrowserAction._panel = panels.Panel({
        contentURL: self.data.url(details.default_popup || '')
    });

    function showPanel() {
        if (details.default_popup) {
            BrowserAction._panel.show({
                position: BrowserAction._button
            });
        }
    }
};

BrowserAction.onClicked = {
    addListener: function(listener) {
        BrowserAction._button.on('click', function() {
            tabs.getCurrent(listener);
        });
    }
};
BrowserAction.setTitle = function(details) {
    BrowserAction._button.state(browserAction, {
        "label": details.title
    });
    // TODO: details.tabId (optional)
};
BrowserAction.getTitle = function(details, callback) {
    // TODO: details.tabId (Optional)
    callback(BrowserAction._button.label);
};
BrowserAction.setIcon = function(details, callback) {
    if (details.imageData) {
        throw new Error('imageData is not supported in Firefox, use path instead.');
    }
    BrowserAction._button.icon = details.path;
    // TODO details.tabId
    callback ? callback() : null;
};
BrowserAction.setPopup = function(details) {
    // TODO details.tabId
    BrowserAction._panel.contentURL = details.popup;
};
BrowserAction.getPopup = function(details, callback) {
    // TODO details.tabId
    callback(BrowserAction._panel.contentURL);
};
BrowserAction.setBadgeText = function(details) {
    // Not implemented
};
BrowserAction.getBadgeText = function(details, callback) {
    // Not implemented
};
BrowserAction.setBadgeBackgroundColor = function(details) {
    // Not implemented
};
BrowserAction.getBadgeBackgroundColor = function(details, callback) {
    // Not implemented
};
BrowserAction.enable = function(tabId) {
    // TODO tabId
    BrowserAction._button.disabled = false;
};
BrowserAction.disable = function(tabId) {
    // TODO tabId
    BrowserAction._button.disabled = true;
};


module.exports = BrowserAction;