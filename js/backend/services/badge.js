'use strict';

define(['backend/port', 'darkwallet', 'dwutil/tasks/transaction'], function(Port, DarkWallet, TransactionTasks) {

/**
 * Service to manage updating all badges.
 */
function BadgeService(core) {
    var self = this;
    this.name = 'badge';
    this.core = core;

    chrome.browserAction.setBadgeBackgroundColor({color:[0,0,0,255]});
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

    // Only count send and receive tasks for now
    var openTasks = identity.tasks.getTasks('send');
    openTasks = openTasks.concat(identity.tasks.getTasks('receive'));

    // Filter to see if there are any unfinished ones
    var unfinished = openTasks.filter(function(task) {return task.state != 'finished'});

    // Set the colour
    if (!unfinished.length) {
        chrome.browserAction.setBadgeBackgroundColor({color:[0,200,0,255]});
    } else {
        chrome.browserAction.setBadgeBackgroundColor({color:[0,0,0,255]});
    }
    // Set the number of tasks
    if (openTasks.length) {
        chrome.browserAction.setBadgeText({text: ""+openTasks.length});
    } else {
        chrome.browserAction.setBadgeText({text: ""});
    }
};


return BadgeService;
});
