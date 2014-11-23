
importScripts('/src/js/backend/workers/loader.js');

require(['util/stealth', 'bitcoinjs-lib'], function(Stealth, Bitcoin) {

  // Stealth cache so we don't process duplicates
  var stealthCache = {};


  /**
   * Callback for messages coming from the application
   */
  self.onmessage = function (oEvent) {
    if (oEvent.data.type == 'stealth') {
        var data = oEvent.data;
        var matches = processPocketStealth(data.stealthArray, data.pocketIndex, data.scanKey, data.spendKey, data.versions, data.oldMode);
        postMessage({type: 'stealth', matches: matches, id: data.id, height: data.height});
    } else {
        console.log("Message not recognized " + oEvent.data);
    }
  };


  /**
   * Process a stealth array for a pocket
   */
  function processPocketStealth(stealthArray, pocketIndex, scanKey, spendKey, versions, oldMode) {
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
          var myKeyBuf = Stealth.uncoverPublic(scanKey, ephemKey, spendKey);

          // Turn to address
          var myKeyHash = Bitcoin.crypto.hash160(myKeyBuf);
          var myAddress = new Bitcoin.Address(myKeyHash, versions.address);

          if (address == myAddress.toString()) {
              matches.push({address: address, ephemKey: ephemKey, pocketIndex: pocketIndex, pubKey: myKeyBuf.toJSON().data});
          } else if (oldMode) {
              // Backwards compatibility introduced in 0.4.0, remove later... we don't do this from v5 (bip44) store on,
              // since scanning old stealth addresses is discontinued anyways (starting on 0.7.0).
              // Try out the stealth row
              Stealth.quirk = true;
              var myKeyBuf2 = Stealth.uncoverPublic(scanKey, ephemKey, spendKey);
              Stealth.quirk = false;

              // Turn to address
              var myKeyHash2 = Bitcoin.crypto.hash160(myKeyBuf2);
              var myAddress2 = new Bitcoin.Address(myKeyHash2, versions.address);
              if ((myAddress2.toString() != myAddress.toString()) && (address == myAddress2.toString())) {
                  matches.push({address: address, ephemKey: ephemKey, pocketIndex: pocketIndex, pubKey: myKeyBuf2.toJSON().data, quirk: true});
              }
          }
      });
      return matches;
  }

});

