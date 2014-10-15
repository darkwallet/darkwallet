'use strict';

define(['bitcoinjs-lib'], function(Bitcoin) {

  // Address scanner
  function Scanner(client, identity, finishCb, updateCb) {
      this.addressVersion = identity.wallet.versions.address;
      this.client = client;

      var mpk = identity.wallet.mpk;
      this.mpKey = Bitcoin.HDNode.fromBase58(mpk);

      this.used = [];
      this.currentPocket = 0;
      this.currentAddress = 0;
      this.lastAddressUsed = {0: 0};
      this.lastPocketUsed = 0;
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
          childKey = childKey.derive(pocket);
          this.pocketCache[pocket] = childKey;
      }
      // Derive address key
      childKey = childKey.derive(n);
      var address = childKey.pubKey.getAddress(Bitcoin.networks[identity.wallet.network]);
      return address.toString();
  };

  Scanner.prototype.scanAddress = function(pocket, n, callback) {
      this.status = 'Scanning ' + pocket + " " + n + " found: " + this.used.length;
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
          this.currentAddress = 0;
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
          if (seq[0]+1 > this.lastPocketUsed) {
              this.target += ((seq[0]+1)-this.lastPocketUsed)*this.addressMargin;
              this.lastPocketUsed = seq[0] + 1;
          }
          if (seq[1] + 1 > this.lastAddressUsed[seq[0]]) {
              this.target += ((seq[1]+1)-this.lastAddressUsed[seq[0]]);
              this.lastAddressUsed[seq[0]] = seq[1] + 1;
          }
      }
      this.scanNext();
  };

  Scanner.prototype.finish = function() {
      this.status = "Finished. Found " + this.used.length + " addresses";
      this.finishCb(null, this.used);
  };

  Scanner.prototype.scan = function() {
      var self = this;
      var seq = [this.currentPocket, this.currentAddress];
      var done = function(err, used) {
          self.onAddressScan(err, seq, used);
      }
      this.scanAddress(this.currentPocket, this.currentAddress, done);
  };

  return Scanner;

});
