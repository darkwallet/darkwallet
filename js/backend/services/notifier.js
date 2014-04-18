define(['backend/port', 'backend/channels/catchan', 'darkwallet'], function(Port, Channel, DarkWallet) {
  'use strict';

  /*
   * Service managing backend notifications.
   * @constructor
   */
  function NotifierService(core) {
    var self = this;
    this.core = core;
    
    // Port for communication with other services
    Port.connect('obelisk', function(data) {
      // WakeUp when connected to obelisk
      if (data.type == 'connected') {
        self.connectTo('Trollbox');
      }
      else if (data.type == 'disconnect') {
        self.channel = null;
      }
    });
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

  // The following is lobby specific and shouldn't be here...
  NotifierService.prototype.connectTo = function(channel) {
    var self = this;
    console.log("[notifier] Connecting to "+channel+"...");
    var lobbyTransport = this.core.getLobbyTransport();
    if (!this.channel) {
      this.channel = lobbyTransport.initChannel(channel, Channel);
      this.channel.addCallback('Shout', function(_d) {self.onShout(channel, _d)});
    }
  };
 
  NotifierService.prototype.onShout = function(channel, msg) {
    var identity = DarkWallet.getIdentity();
    if (identity.settings.notifications.popup) {
      console.log("[notifier] Received message: " + msg.body.text);
      this.post(channel, msg.body.text);
    }
  };

  return NotifierService;

});
