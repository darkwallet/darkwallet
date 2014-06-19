'use strict';

define([], function() {


/**
 * Service to manage content script requests.
 */
function ContentService(core) {
    this.name = 'content';
    this.addNewTabListener();
};

/**
 * 
 */
ContentService.prototype.addNewTabListener = function() {
    var self = this;
    chrome.runtime.onMessage.addListener(function(data) {
        if (data.type == 'newTab') {
            chrome.tabs.query({highlighted: true}, function(tabs) {
              self.previousTab = tabs[0];
            });
            chrome.tabs.create({url: data.url});
        }
    });
};

ContentService.prototype.highlightPreviousTab = function(callback) {
    chrome.tabs.highlight({tabs: this.previousTab.index}, callback);
}

return ContentService;
});
