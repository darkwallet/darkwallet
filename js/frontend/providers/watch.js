'use strict';

define(['./module', 'darkwallet'], function (providers, DarkWallet) {
  providers.factory('watch', ['$wallet', '$history', function($wallet, $history) {
  // - start provider

  /**
   * Watch / ReadOnly Pockets from contact
   */
  function WatchProvider() {
  }

  // Remove a watch only pocket from a contact
  WatchProvider.prototype.removePocket = function(contact) {
    return $history.removePocket('readonly', contact.data.name);
  };

  // Add a watch only pocket from a contact
  WatchProvider.prototype.initPocket = function(contact) {
    var identity = DarkWallet.getIdentity();
    var pocketId = contact.data.name;

    // Create the pocket and addreses
    var pocket = identity.wallet.pockets.initPocketWallet(pocketId, 'readonly');
    var addresses = pocket.fromContact(contact);

    // Load addresses into scope
    addresses.forEach(function(walletAddress) {
         // Init address
        $wallet.initAddress(walletAddress);
    });
  };

  // Rename a pocket linked to some contact
  WatchProvider.prototype.renamePocket = function(newName, prevName) {
    var identity = DarkWallet.getIdentity();
    var pockets = identity.wallet.pockets.getPockets('readonly');
    if (prevName && prevName !== newName && pockets[prevName]) {
        var newIndex = 'readonly:'+newName;
        var pocket = pockets[prevName];
        // Save the name in the pocket
        pocket.name = newName;
        pocket.store.id = newName;
        //  Reindex with the new pocketId
        pockets[newName] = pocket;
        delete pockets[prevName];
        // If any addresses are using the old index reindex them
        var reindexed = [];
        Object.keys(identity.wallet.pubKeys).forEach(function(seq) {
            var walletAddress = identity.wallet.pubKeys[seq];
            if (walletAddress && walletAddress.index[0] === ('readonly:'+prevName)) {
                // Save the index before changing it
                reindexed.push(walletAddress.index.slice());
                // Change the index to the new name
                walletAddress.index[0] = newIndex;
                identity.wallet.pubKeys[newIndex] = walletAddress;
            }
        });
        // Now delete all reindexed
        reindexed.forEach(function(seq) {
            delete identity.wallet.pubKeys[seq];
        });
    }
  };


  // Remove watched contact key
  WatchProvider.prototype.removeKey = function(contact, key) {
    var identity = DarkWallet.getIdentity();
    if (key && key.address && key.type !== 'stealth') {
        var pocket = identity.wallet.pockets.getPocket(contact.data.name, 'readonly');
        var walletAddress = pocket.getWalletAddress(key.address);
        if (walletAddress) {
            pocket.removeAddress(walletAddress);
            $wallet.removeAddress(walletAddress);
        }
    }
  };

  // Add watched contact key
  WatchProvider.prototype.addKey = function(contact, key) {
    var identity = DarkWallet.getIdentity();
    var pocket = identity.wallet.pockets.getPocket(contact.data.name, 'readonly');
    var walletAddress = pocket.createAddress(key);
    if (walletAddress) {
        $wallet.initAddress(walletAddress);
    }
  };

  // Rename watched contact key
  WatchProvider.prototype.renameKey = function(contact, key) {
    var identity = DarkWallet.getIdentity();
    var pocket = identity.wallet.pockets.getPocket(contact.data.name, 'readonly');
    if (key && key.address && key.type !== 'stealth') {
        var seq = ['readonly:'+contact.data.name, key.address];
        var walletAddress = identity.wallet.pubKeys[seq];
        if (walletAddress) {
            walletAddress.label = key.label;
        }
    }
  };

  // - end provider
  return new WatchProvider($wallet);
  }]);
});
