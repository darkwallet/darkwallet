/**
 * @fileOverview Wallet classes.
 */

/**
 * Wallet constructor class.
 * @param {Object} $scope Angular scope.
 * @constructor
 */
function WalletCtrl($scope) {
  var pubKey, mpKey, addressIndex;

  // generated addresses
  $scope.addresses = [];
  $scope.changeAddresses = [];
  $scope.subsection = 'history';

  var keyRing = DarkWallet.keyRing;

  // Got history for an address
  function historyFetched(err, walletAddress, history) {
      var client = DarkWallet.obeliskClient.client;

      // pass to the wallet to process outputs
      $scope.identity.wallet.processHistory(walletAddress.address, history);

      // now subscribe the address for notifications
      client.subscribe(walletAddress.address, function(err, res) {
          console.log("subscribed", walletAddress.address, err, res);

          // fill history after subscribing to ensure we got all histories already (for now).
          $scope.identity.history.fillHistory(history);
      }, function(addressUpdate) {
          console.log("update", addressUpdate)
      });
      $scope.totalBalance = $scope.identity.wallet.getBalance();
      $scope.$apply();
  }

  // Start up history for an address
  function initAddress(walletAddress) {
      var client = DarkWallet.obeliskClient.client;
      client.fetch_history(walletAddress.address, function(err, res) { historyFetched(err, walletAddress, res); });
      if (walletAddress.history) {
          $scope.identity.history.fillHistory(walletAddress.history)
      }
  }

  // We got initial current blockchain height
  function heightFetched(err, height) {
      console.log("height fetched", height);
      $scope.currentHeight = height;
  }

  // Handle initial connection to obelisk
  function handleConnect() {
      var client = DarkWallet.obeliskClient.client;
      client.fetch_last_height(heightFetched);

      // get balance for addresses
      $scope.addresses.forEach(initAddress);
      $scope.changeAddresses.forEach(initAddress);
  }

  // Initialize if empty wallet
  function initializeEmpty() {
      if ($scope.addresses.length == 0) {
          // generate 5 addresses for now
          for(var idx=0; idx<5; idx++) {
              $scope.generateAddress(0);
          }
      }
  }

  function loadAddresses() {
      var identity = $scope.identity;
      /* Load addresses into angular */
      Object.keys(identity.wallet.pubKeys).forEach(function(pubKeyIndex) {
          var walletAddress = identity.wallet.getAddress(pubKeyIndex);
          // Regular addresses
          if (walletAddress.index.length > 1) {
              // add to scope
              var addressArray = walletAddress.index[0] ? $scope.changeAddresses : $scope.addresses;
              addressArray.push(walletAddress);
          }
      });
  }

  function loadIdentity(identity) {
      // set some links
      $scope.identity = identity;
      $scope.history = identity.history.history;
      // set history update callback
      identity.history.update = function() { $scope.$apply(); }
      $scope.totalBalance = identity.wallet.getBalance();

      // load addresses into angular
      loadAddresses();

      // initialize if empty wallet
      initializeEmpty();

      // apply scope changes
      $scope.$apply();

      DarkWallet.obeliskClient.connect('ws://85.25.198.97:8888', handleConnect);
  };

  // Load identities
  keyRing.loadIdentities(function(names) {
    if (!names) {
       console.log("bad loading");
       return;
    }
    // get the first identity
    keyRing.get(names[0], loadIdentity);
  });

  // scope function to generate (or load from cache) a new address
  $scope.generateAddress = function(isChange, n) {
    var addressArray = isChange ? $scope.changeAddresses : $scope.addresses;
    if (n === undefined || n === null) {
        n = addressArray.length;
    }
    var walletAddress = $scope.identity.wallet.getAddress([isChange, n]);

    // add to scope
    addressArray.push(walletAddress)

    // get history for the new address
    initAddress(walletAddress);
    return walletAddress;
  };

  // get a free change address or a new one
  $scope.getChangeAddress = function() {
    for(var idx=0; $scope.changeAddresses.length; idx++) {
        if ($scope.changeAddresses[idx].balance == 0) {
            return $scope.changeAddresses[idx];
        }
    }
    return $scope.generateAddress(1);
  }

  // function to receive stealth information
  $scope.receiveStealth = function() {
      var client = DarkWallet.obeliskClient.client;
      var stealth_fetched = function(error, results) {
          if (error) {
              write_to_screen('<span style="color: red;">ERROR:</span> ' + error);
              return;
          }
          console.log("STEALTH", results);
          $scope.identity.wallet.processStealth(results, $scope.send.password);
      }
      client.fetch_stealth([0,0], stealth_fetched, 0);
  }
  $scope.section = 'history';
};
