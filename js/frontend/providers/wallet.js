'use strict';

define(['./module', 'darkwallet'], function (providers, DarkWallet) {

  function WalletProvider($scope) {
      this.addresses = {};
      this.allAddresses = [];
  }

  WalletProvider.prototype.onIdentityLoaded = function(identity) {
      this.addresses = {};
      this.allAddresses.splice(0, this.allAddresses.length);

      // load addresses for this identity
      this.loadAddresses(identity);
  }

  WalletProvider.prototype.loadAddresses = function(identity) {
      var self = this;
      // Init pockets
      for(var idx=0; idx<identity.wallet.pockets.hdPockets.length; idx++) {
          self.initPocket(idx);
      };
      /* Load addresses into angular */
      Object.keys(identity.wallet.pubKeys).forEach(function(pubKeyIndex) {
          var walletAddress = identity.wallet.getAddress(pubKeyIndex);
          // Regular addresses
          // add to scope
          var branchId = walletAddress.index[0];
          if (!self.addresses[branchId]) {
              self.addresses[branchId] = [];
          }
          var addressArray = self.addresses[branchId];
          if (self.allAddresses.indexOf(walletAddress) == -1) {
              addressArray.push(walletAddress);
              self.allAddresses.push(walletAddress);
          }
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
          if (DarkWallet.getKeyRing().availableIdentities.length) {
              DarkWallet.core.loadIdentity(0);
          }
      }
  }

  /**
   * Generates (or load from cache) a new address
   * @param {Integer} branchId
   * @param {Integer} n
   * @returns {Object} Wallet address struct
   */
  WalletProvider.prototype.generateAddress = function(branchId, n) {
      if (!branchId) {
          branchId = 0;
      }
      if (!this.addresses[branchId]) {
          this.addresses[branchId] = [];
      }
      var addressArray = this.addresses[branchId];
      if (n === undefined || n === null) {
          // iterate over available addresses to find out next n
          n = -1;
          this.addresses[branchId].forEach(function(address) {
              n = max(n, address.index[1]||0);
          });
          n += 1;
      }
      var walletAddress = DarkWallet.getIdentity().wallet.getAddress([branchId, n]);

      // Init this address
      this.initAddress(walletAddress);
      return walletAddress;
  };

  // initialize an address on the scope and the backend
  WalletProvider.prototype.removeAddress = function(walletAddress) {
      // remove from scope
      var thisCache = this.addresses[walletAddress.index[0]];
      var allCache = this.allAddresses;
      [thisCache, allCache].forEach(function(cache) {
          if (cache) { 
              var idx = cache.indexOf(walletAddress);
              if (idx > 0) {
                  cache.splice(idx, 1);
              }
          }
      });

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

  // Initialize pocket structures.
  WalletProvider.prototype.initPocket = function(pocketId) {
      var branchId = pocketId*2;
      if (!this.addresses[branchId]) {
          this.addresses[branchId] = [];
      }
      if (!this.addresses[branchId+1]) {
          this.addresses[branchId+1] = [];
      }
  };

  // Add a wallet address to scope
  WalletProvider.prototype.addToScope = function(walletAddress) {
    var identity = DarkWallet.getIdentity();
    var pocketId = identity.wallet.pockets.getAddressPocketId(walletAddress);
    if (!walletAddress.type) {
        this.initPocket(pocketId);
    } else {
        if (!this.addresses[walletAddress.index[0]]) {
            this.addresses[walletAddress.index[0]] = [];
        }
    }
    var addressArray = this.addresses[walletAddress.index[0]];
    if (this.allAddresses.indexOf(walletAddress) == -1) {
        addressArray.push(walletAddress);
        this.allAddresses.push(walletAddress);
    }
  };


  providers.factory('$wallet', ['$rootScope', function($rootScope) {
    console.log("[WalletProvider] Initialize");
    return new WalletProvider($rootScope.$new());
  }]);
});
