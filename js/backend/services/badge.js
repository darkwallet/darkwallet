'use strict';

define(['backend/port', 'darkwallet', 'dwutil/tasks/transaction'], function(Port, DarkWallet, TransactionTasks) {

/**
 * Service to manage updating all badges.
 */
function BadgeService(core) {
    var self = this;
    this.name = 'badge';
    this.core = core;

    // Port to listen for open tabs so we can do something when
    // the tab closes
    Port.listen('badge', function() {
        }, function(port) {
            // Connected
        }, function(port) {
            // Disconnected
            if (DarkWallet.getIdentity() && TransactionTasks.checkFinished()) {
                self.setItems();
            }
    });
};


/**
 * Set item number from the given identity (or current identity)
 */
BadgeService.prototype.setItems = function(identity) {
    var identity = identity || this.core.getCurrentIdentity();
    var openTasks = identity.tasks.getOpenTasks();
    if (openTasks) {
        chrome.browserAction.setBadgeText({text: ""+openTasks});
    } else {
        chrome.browserAction.setBadgeText({text: ""});
    }
};


return BadgeService;
});
