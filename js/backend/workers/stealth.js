
importScripts('/js/backend/workers/loader.js');

require(['util/stealth', 'bitcoinjs-lib'], function(Stealth, Bitcoin) {

  // Stealth cache so we don't process duplicates
  var stealthCache = {};


  /**
   * Callback for messages coming from the application
   */
  self.onmessage = function (oEvent) {
    if (oEvent.data.type == 'stealth') {
        var data = oEvent.data;
        var matches = processPocketStealth(data.stealthArray, data.pocketIndex, data.scanKey, data.spendKey, data.versions);
        postMessage({type: 'stealth', matches: matches, id: data.id, height: data.height});
    } else {
        console.log("Message not recognized " + oEvent.data);
    }
  };


  /**
   * Process a stealth array for a pocket
   */
  function processPocketStealth(stealthArray, pocketIndex, scanKey, spendKey, versions) {
      var matches = [];

      // Stealth cache can't have more items than stealth array otherwise is invalid
      // This is because stealth array is accumulating items till it refreshes after 100 blocks (obelisk quirk)
      if (!stealthCache[pocketIndex] || (stealthCache[pocketIndex].length > stealthArray.length)) {
          stealthCache[pocketIndex] = [];
      }
      // Check the array
      stealthArray.forEach(function(stealthData) {
          var ephemKey = Bitcoin.convert.hexToBytes(stealthData[0]);
          var address = stealthData[1];
          var txId = stealthData[2];

          // Check if we've already seen this tx+address combination
          if (stealthCache[pocketIndex].indexOf(txId+address) > -1) {
              return;
          }
          stealthCache[pocketIndex].push(txId+address);

          // Try out the stealth row
          var myKeyBytes = Stealth.uncoverPublic(scanKey, ephemKey, spendKey);

          // Turn to address
          var myKeyHash = Bitcoin.crypto.hash160(myKeyBytes);
          var myAddress = new Bitcoin.Address(myKeyHash, versions.address);

          if (address == myAddress.toString()) {
              matches.push({address: address, ephemKey: ephemKey, pocketIndex: pocketIndex, pubKey: myKeyBytes});
          } else {
              // Backwards compatibility introduced in 0.4.0, remove later...
              // Try out the stealth row
              Stealth.quirk = true;
              var myKeyBytes2 = Stealth.uncoverPublic(scanKey, ephemKey, spendKey);
              Stealth.quirk = false;

              // Turn to address
              var myKeyHash2 = Bitcoin.crypto.hash160(myKeyBytes2);
              var myAddress2 = new Bitcoin.Address(myKeyHash2, versions.address);
              if ((myAddress2.toString() != myAddress.toString()) && (address == myAddress2.toString())) {
                  matches.push({address: address, ephemKey: ephemKey, pocketIndex: pocketIndex, pubKey: myKeyBytes, quirk: true});
              }
          }
      });
      return matches;
  }

});

