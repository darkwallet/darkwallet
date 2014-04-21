'use strict';

define(['frontend/channel_link'], function (ChannelLink) {

  describe('Channel Link', function() {

    it('Creates a channel link', function() {
      var channelLink = new ChannelLink('test');
      expect(channelLink.channel).toBeDefined();
      expect(channelLink.callbacks.length).toBe(0);
    });

    it('Creates a channel link with scope', function() {
      var callbacks = [];
      var scope = {
          $on: function(_name, _cb) { callbacks.push(_cb) }
      }

      var channelLink = new ChannelLink('test', scope);

      expect(channelLink.channel).toBeDefined();
      expect(channelLink.callbacks.length).toBe(0);
      expect(callbacks.length).toBe(1);

      // Nowtrigger the (destroy) event
      channelLink.callbacks = [[1,2]];
      callbacks[0]();

      // The callbacks should be disconnected since we sent the event
      expect(channelLink.callbacks.length).toBe(0);
    });

    it('Adds a callback', function() {
      var channelLink = new ChannelLink('test');

      channelLink.addCallback('event', function() {});

      expect(channelLink.callbacks.length).toBe(1)
    });

    it('Disconnects callbacks', function() {
      var channelLink = new ChannelLink('test');

      channelLink.addCallback('event1', function() {});
      channelLink.addCallback('event2', function() {});

      expect(channelLink.callbacks.length).toBe(2)

      channelLink.disconnect();
      expect(channelLink.callbacks.length).toBe(0)
    });

    it('Starts', function() {
      var callbacks = [];
      var port = {postMessage: function(_obj) {callbacks.push(_obj)}};

      ChannelLink.start('foo', port);

      expect(callbacks.length).toBe(1)
      expect(callbacks[0].type).toBe('initChannel')
      expect(callbacks[0].name).toBe('foo')
    });
 
  });
 
});
