/*
 * @fileOverview Background service running for the wallet
 */
define(['model/keyring', 'backend/services'],
function(IdentityKeyRing, Services) {
  'use strict';

  function WalletService(core) {
    var keyRing = new IdentityKeyRing();
    var self = this;

    // Some scope variables
    var currentIdentity = 0;

    var identityNames = [];

    var currentHeight = 0;

    // Wallet port
    Services.start('wallet', function() {
      }, function(port) {
          // onMessage
          console.log('[bus] wallet client connected');
          if (currentIdentity && keyRing.identities.hasOwnProperty(currentIdentity)) {
              port.postMessage({'type': 'ready', 'identity': currentIdentity})
          }
      }, function(port) {
          // Connected
          console.log('[bus] wallet client disconnected');
    });

    /***************************************
    /* Identities
     */

    this.loadIdentity = function(idx) {
        var name = keyRing.availableIdentities[idx];
        if (currentIdentity != name) {
            console.log("[wallet] Load identity", name)
            currentIdentity = name;
            keyRing.get(name, function(identity) {
                identity.history.update = function() { Services.post('gui', {name: 'update'}); };
                Services.post('wallet', {'type': 'ready', 'identity': name})
                Services.post('wallet', {'type': 'loaded', 'identity': name})
            });
        }
    }

    // Get an identity from the keyring
    this.getIdentity = function(idx) {
        if (idx === null || idx === undefined) {
            return self.getCurrentIdentity();
        }
        var identity = keyRing.availableIdentities[idx];
        currentIdentity = identity;
        return keyRing.identities[identity];

    }
    this.getCurrentIdentity = function() {
        return keyRing.identities[currentIdentity];
    }

    /***************************************
    /* History and address subscription
     */
    function historyFetched(err, walletAddress, history) {
        if (err) {
            console.log("[wallet] Error fetching history for", walletAddress.address);
            return;
        }
        var client = core.getClient();
        var identity = self.getCurrentIdentity();

        // pass to the wallet to process outputs
        identity.wallet.processHistory(walletAddress.address, history);

        // now subscribe the address for notifications
        client.subscribe(walletAddress.address, function(err, res) {
            console.log("[wallet] subscribed", walletAddress.address, err, res);

            // fill history after subscribing to ensure we got all histories already (for now).
            identity.history.fillHistory(walletAddress, history);
        }, function(addressUpdate) {
            console.log("[wallet] update", addressUpdate)
        });
        Services.post('gui', {type: "balance"});
    }

    // Start up history for an address
    this.initAddress = function(walletAddress) {
        var client = core.getClient();
        if (!client) {
            // TODO manage this case better
            console.log("trying to init address but not connected yet!... skipping :P");
            return;
        }
        var identity = self.getCurrentIdentity();
        client.fetch_history(walletAddress.address, function(err, res) { historyFetched(err, walletAddress, res); });
        if (walletAddress.history) {
            identity.history.fillHistory(walletAddress, walletAddress.history)
        }
    }

    // Handle initial connection to obelisk
    function handleHeight(err, height) {
        currentHeight = height;
        Services.post('gui', {type: 'height', value: height})
        console.log("[wallet] height fetched", height);
    }

    this.handleInitialConnect = function() {
        var client = core.getClient();
        client.fetch_last_height(handleHeight);

        // get balance for addresses
        var identity = self.getCurrentIdentity();

        Object.keys(identity.wallet.pubKeys).forEach(function(pubKeyIndex) {
            var walletAddress = identity.wallet.pubKeys[pubKeyIndex];
            if (walletAddress.index.length > 1) {
                self.initAddress(walletAddress);
            }
        });
    }

    this.getKeyRing = function() {
        return keyRing;
    }
  }
  return WalletService;
});

