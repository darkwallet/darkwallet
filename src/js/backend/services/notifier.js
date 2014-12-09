'use strict';

define([], function() {

  /*
   * Service managing backend notifications.
   * @constructor
   */
  function NotifierService(core) {
    this.name = 'notifier';
    this.core = core;
  }
   
  /**
   * Post a message using the notification system
   */
  NotifierService.prototype.post = function(title, message) {
      var notification = new Notification(title, {body: message});
      notification.onshow = function() {
        setTimeout(function() {
          notification.close();
        }, 10000);
      };
  };

  return NotifierService;

});
