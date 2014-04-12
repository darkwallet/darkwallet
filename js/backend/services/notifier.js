define(['backend/services', 'backend/channels/catchan'], function(Services, Channel) {
  'use strict';

  /*
   * Service managing backend notifications.
   * @constructor
   */
  function NotifierService(core) {
    var self = this;
    this.core = core;
    
    // Port for communication with other services
    Services.connect('obelisk', function(data) {
      // WakeUp when connected to obelisk
      if (data.type == 'connected') {
        self.connectTo('Trollbox');
      }
    });
  }
  
  NotifierService.prototype.connectTo = function(channel) {
    var self = this;
    console.log("[notifier] Connecting to "+channel+"...");
    var lobbyTransport = this.core.getLobbyTransport();
    if (!this.channel) {
      this.channel = lobbyTransport.initChannel(channel, Channel);
      this.channel.addCallback('Shout', function(_d) {self.onChannelOpen(channel, _d)});
    }
  }
  
  NotifierService.prototype.onChannelOpen = function(channel, msg) {
    console.log("[notifier] Received message: " + msg.body.text);
    var notification = new Notification(channel, {body: msg.body.text});
    notification.onshow = function() {
      setTimeout(function() {
        notification.close();
      }, 10000);
    };
  }

  return NotifierService;

});
