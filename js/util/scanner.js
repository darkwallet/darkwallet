'use strict';

define(['bitcoinjs-lib'], function(Bitcoin) {

  // Address scanner
  function Scanner(client, identity, masterKey, finishCb, updateCb, scanMain) {
      this.network = identity.wallet.network;
      this.client = client;
      this.masterKey = masterKey ? Bitcoin.HDNode.fromBase58(masterKey) : false;
      this.oldStyle = !this.masterKey;

      var mpk = (this.oldStyle && identity.store.get('version') > 4) ? identity.wallet.oldMpk : identity.wallet.mpk;
      this.mpKey = Bitcoin.HDNode.fromBase58(mpk);

      this.scanMain = scanMain;
      this.used = [];
      this.currentPocket = 0;
      this.currentAddress = scanMain ? -1 : 0;
      this.lastAddressUsed = {0: 0};
      this.lastPocketUsed = 0;
      this.pocketAddressesUsed = 0;
      this.setMargins(5, 10);
      this.scanned = 0;
      this.pocketCache = {};
      this.status = '';
      this.finishCb = finishCb;
      this.updateCb = updateCb;
  }

  Scanner.prototype.setMargins = function(pocketMargin, addressMargin) {
      this.pocketMargin = pocketMargin*2;
      this.addressMargin = addressMargin;
      this.target = this.pocketMargin*this.addressMargin;
  };

  Scanner.prototype.getAddress = function(pocket, n) {
      var childKey = this.mpKey;
      // Derive pocket key
      if (this.pocketCache.hasOwnProperty(pocket)) {
          childKey = this.pocketCache[pocket];
      } else {
          if (this.oldStyle) {
              childKey = childKey.derive(pocket);
          } else {
              childKey = this.masterKey.deriveHardened(Math.floor(pocket/2));
              childKey = childKey.derive(pocket%2);
          }
          this.pocketCache[pocket] = childKey;
      }
      // Derive address key (-1 means master)
      if (n >= 0) {
          childKey = childKey.derive(n);
      }
      var address = childKey.pubKey.getAddress(Bitcoin.networks[this.network]);
      return address.toString();
  };

  Scanner.prototype.scanAddress = function(pocket, n, callback) {
      var nLabel = (n == -1) ? 'm' : n;
      this.status = 'Scanning ' + pocket + " " + nLabel + " found: " + this.used.length;
      var address = this.getAddress(pocket, n);
      this.scanned += 1;
      this.client.fetch_history(address, 0, function(err, history) {
          callback(err, (history && history.length));
      });
      this.updateCb ? this.updateCb(this.scanned, this.target) : null;
  };

  Scanner.prototype.scanNext = function() {
      this.currentAddress+=1;
      if ((this.currentAddress - this.lastAddressUsed[this.currentPocket]) >= this.addressMargin) {
          this.currentAddress = this.scanMain ? -1 : 0;
          this.currentPocket += 1;
          this.lastAddressUsed[this.currentPocket] = 0;
      }
      if ((this.currentPocket - this.lastPocketUsed) >= this.pocketMargin) {
          this.finish();
      } else {
          this.scan();
      }
  };

  Scanner.prototype.onAddressScan = function(err, seq, used) {
      if (err) {
          this.finishCb(err, this.used);
          return;
      }
      if (used) {
          this.used.push(seq);
          if (seq.length == 1) {
              this.pocketAddressesUsed += 1;
          }
          var pocketIdx = this.oldStyle ? seq[0] : (seq[0]*2)+seq[1];
          if (pocketIdx+1 > this.lastPocketUsed) {
              this.target += ((pocketIdx+1)-this.lastPocketUsed)*this.addressMargin;
              this.lastPocketUsed = pocketIdx + 1;
          }
          var addressIdx = this.oldStyle ? seq[1] : seq[2];
          if (addressIdx + 1 > this.lastAddressUsed[pocketIdx]) {
              this.target += (addressIdx+1-this.lastAddressUsed[pocketIdx]);
              this.lastAddressUsed[pocketIdx] = addressIdx + 1;
          }
      }
      this.scanNext();
  };

  Scanner.prototype.finish = function() {
      this.status = "Finished. Found " + this.used.length + " addresses";
      this.finishCb(null, this.used, this.pocketAddressesUsed);
  };

  Scanner.prototype.scan = function() {
      var self = this;
      var seq = this.oldStyle ? [this.currentPocket] : [Math.floor(this.currentPocket/2), this.currentPocket%2];
      // -1 means pocket address
      if (this.currentAddress > -1) {
          seq.push(this.currentAddress);
      }
      var done = function(err, used) {
          self.onAddressScan(err, seq, used);
      }
      this.scanAddress(this.currentPocket, this.currentAddress, done);
  };

  return Scanner;

});
