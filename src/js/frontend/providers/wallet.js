'use strict';

define(['./module', 'darkwallet'], function (providers, DarkWallet) {

  function WalletProvider($scope) {
      this.allAddresses = [];
  }

  WalletProvider.prototype.onIdentityLoaded = function(identity) {
      this.allAddresses.splice(0, this.allAddresses.length);

      // load addresses for this identity
      this.loadAddresses(identity);
  }

  WalletProvider.prototype.loadAddresses = function(identity) {
      var self = this;

      /* Load addresses into angular */
      Object.keys(identity.wallet.pubKeys).forEach(function(pubKeyIndex) {
          var walletAddress = identity.wallet.getAddress(pubKeyIndex);
          // add to scope
          self.addToScope(walletAddress);
      });
  }

  /**
   * Instruct the DarkWallet to load an identity
   */
  WalletProvider.prototype.loadIdentity = function(callback) {
      // Load identity
      var identity = DarkWallet.getIdentity();
      if (identity) {
          callback(identity);
      } else {
          DarkWallet.keyring.getIdentityNames(function(availableIdentities) {
              if (availableIdentities.length) {
                  DarkWallet.core.loadIdentity(0);
              }
          });
      }
  }

  /**
   * Generates (or load from cache) a new address
   * @param {Integer} branchId
   * @param {Integer} n
   * @param {Boolean} oldStyle generate old style address
   * @returns {Object} Wallet address struct
   */
  WalletProvider.prototype.generateAddress = function(pocketId, n, change, oldStyle) {
      change = change || 0;
      var identity = DarkWallet.getIdentity();
      if (!pocketId) {
          pocketId = 0;
      }
      if (n === undefined || n === null) {
          var address, currSeq;
          n = 0;
          do {
              currSeq = (identity.store.get('version') > 4 && !oldStyle) ? [pocketId, change, n] : [(pocketId*2)+change, n]; 
              address = identity.wallet.pubKeys[currSeq];
              n += 1;
          } while (address);
          n -= 1;
      }
      var seq;
      if (identity.store.get('version') > 4 && !oldStyle) {
          seq = [pocketId, change, n];
      } else {
          seq = [branchId, n];
      }
      var walletAddress = identity.wallet.getAddress(seq);

      // Init this address
      this.initAddress(walletAddress);
      return walletAddress;
  };

  // remove an address from the scope and the backend
  WalletProvider.prototype.removeAddress = function(walletAddress) {
      // remove from global list
      var idx = this.allAddresses.indexOf(walletAddress);
      if (idx >= 0) {
          this.allAddresses.splice(idx, 1);
      }

      // remove from backend
      DarkWallet.service.wallet.removeAddress(walletAddress);
      return walletAddress;
  };

  // remove an address from the scope and wallet
  WalletProvider.prototype.initAddress = function(walletAddress) {
       // add to scope
      this.addToScope(walletAddress);

      // get history for the new address
      DarkWallet.core.initAddress(walletAddress);
      return walletAddress;
  };


  // get a free change address or a new one
  WalletProvider.prototype.getChangeAddress = function(pocketId, pocketType) {
      var identity = DarkWallet.getIdentity();
      if (!pocketId) pocketId = 0;
      if (!pocketType) pocketType = 'hd';
      var pocket = identity.wallet.pockets.getPocket(pocketId, pocketType);
      var changeAddress = pocket.getChangeAddress();
      this.addToScope(changeAddress);
      return changeAddress;
  };

  // Add a wallet address to scope
  WalletProvider.prototype.addToScope = function(walletAddress) {
    if (this.allAddresses.indexOf(walletAddress) == -1) {
        this.allAddresses.push(walletAddress);
    }
  };


  providers.factory('$wallet', ['$rootScope', function($rootScope) {
    console.log("[WalletProvider] Initialize");
    return new WalletProvider($rootScope.$new());
  }]);
});
