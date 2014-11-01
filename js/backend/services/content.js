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
    chrome.runtime.onMessage.addListener(function(data) {
        if (data.type == 'newTab') {
            chrome.tabs.query({active: true}, function(tabs) {
                chrome.tabs.create({url: data.url, openerTabId: tabs[0].id});
            });
        }
    });
};

return ContentService;
});
