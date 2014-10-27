'use strict';

define(['darkwallet'], function (DarkWallet) {
  var ChannelLink = function(name, scope) {
      this.callbacks = [];
      var transport = DarkWallet.getLobbyTransport();
      this.channel = transport.getChannel(name);
      console.log("[LobbyCtrl] Link channel", this.channel);
      if (scope) {
          this.linkNg(scope);
      }
  };
  ChannelLink.links = {};
  ChannelLink.prototype.linkNg = function(scope) {
      var self = this;
      scope.$on('$destroy', function () {
          console.log("[LobbyCtrl] Unlink channels");
          self.disconnect();
      });
  };
  ChannelLink.prototype.addCallback = function(name, callback) {
      this.callbacks.push([name, callback]);
      return this.channel.addCallback(name, callback);
  };
  ChannelLink.prototype.disconnect = function() {
      var self = this;
      this.callbacks.forEach(function(cbArgs) {
          self.channel.removeCallback(cbArgs[0], cbArgs[1]);
      });
      this.callbacks = [];
  };
  ChannelLink.start = function(name, port) {
      console.log("[LobbyCtrl] Create channel", name);
      port.postMessage({'type': 'initChannel', name: name});
  };

  ChannelLink.create = function(name, scope, notify) {
      var channelLink;
      if (ChannelLink.links.hasOwnProperty(name)) {
          // Channel is already linked
          channelLink = ChannelLink.links[name];
      } else {
          // Totally new channel, subscribe
          channelLink = new ChannelLink(name, scope);
          ChannelLink.links[name] = channelLink;
          channelLink.addCallback('subscribed', function() {
              notify.success(_('channel'), _('subscribed successfully'));
              scope.lastTimestamp = Date.now();
              channelLink.channel.sendOpening();
              if(!scope.$$phase) {
                  scope.$apply();
              }
          });
          channelLink.addCallback('Contact', function(data) {
              notify.success(_('contact'), data.body.name);
              var peer = data.peer;
              scope.newContact = data.body;
              scope.newContact.pubKeyHex = peer.pubKeyHex;
              scope.newContact.fingerprint = peer.fingerprint;
          });
          channelLink.addCallback('Beacon', function(data) {
              scope.updateChat();
          });
          channelLink.addCallback('Pair', function(data) {
              scope.updateChat();
          });
          channelLink.addCallback('Shout', function(data) {
              var channel = channelLink.channel;

              // add user pubKeyHex to use as identicon
              if (!data.peer) {
                  // lets set a dummy hex code for now
                  console.log("[Lobby] no peer!!!")
                  data.peer = {pubKeyHex: "deadbeefdeadbeefdeadbeef"};
              }

              // show notification
              if (data.sender != channel.fingerprint) {
                  notify.note(data.peer.name, data.body.text);
              }
              scope.updateChat();
          });
      }
      return channelLink;
  };
  return ChannelLink;
});
