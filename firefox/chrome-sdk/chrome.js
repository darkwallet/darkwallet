var chrome = function(manifest) {
    if (manifest.browser_action) {
        chrome.browserAction(manifest.browser_action);
    }
    require("./worker").init(chrome);
};
chrome.browserAction = require("./browser_action");
chrome.tabs =  require("./tabs");
chrome.storage = require("./storage");

module.exports = chrome;