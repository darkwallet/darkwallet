define(['backend/services'],
function(Services) {
  'use strict';
  function MixerService(core) {
    var self = this;

    // Port for communication with other services
    Services.connect('obelisk', function(data) {
      // WakeUp when connected to obelisk
      if (data.type == 'connected') {
        var client = core.getClient();
        var identity = core.getCurrentIdentity();

        // Check to see we have anything to mix
        var anyMixing = false;
        identity.wallet.pockets.forEach(function(pocket) {
          if (pocket.mixing) {
            anyMixing = true;
          }
        });

        // If any is mixing make sure we are connected
        if (anyMixing) {
          self.connectMixer();
        }
      }

    });
  }

  MixerService.prototype.connectMixer = function() {
    console.log("[mixer] Connect...");
  }

  return MixerService;

});
