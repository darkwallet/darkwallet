define(['darkwallet'], function (DarkWallet) {
  var ChannelLink = function(name, scope) {
      this.callbacks = []
      var transport = DarkWallet.getLobbyTransport();
      this.channel = transport.getChannel(name)
      console.log("[LobbyCtrl] Link channel", this.channel);
      if (scope) {
          this.linkNg(scope)
      }
  }
  ChannelLink.prototype.linkNg = function(scope) {
      var self = this;
      scope.$on('$destroy', function () {
          console.log("[LobbyCtrl] Unlink channels");
          self.disconnect();
      });
  }
  ChannelLink.prototype.addCallback = function(name, callback) {
      this.callbacks.push([name, callback])
      return this.channel.addCallback(name, callback);
  }
  ChannelLink.prototype.disconnect = function() {
      this.callbacks.forEach(function(cbArgs) {
          this.channel.removeCallback(cbArgs[0], cbArgs[1])
      })
      this.callbacks = []
  }
  ChannelLink.start = function(name, port) {
      console.log("[LobbyCtrl] Create channel", name);
      port.postMessage({'type': 'initChannel', name: name});
  }

  return ChannelLink;
});
