'use strict';

define(['bitcoinjs-lib', 'mnemonicjs', 'util/encryption'],
function (Bitcoin, Mnemonic, Encryption) {

  /**
   * Peer in the communications system
   * @constructor
   */
  function Peer(pubKey, fingerprint, channel) {
      if (pubKey) {
          this.updateKey(pubKey);
      } else {
          // We don't have the pubkey yet, fill in some dummy values for now
          this.pubKeyHex = 'deadbeefdeadbeefdeadbeef';
          this.pubKey = Bitcoin.convert.hexToBytes(this.pubKeyHex);
          this.fingerprint = fingerprint;
          this.name = this.getMnemoname(this.pubKey);
      }
      this.channel = channel;
      this.chatLog = [];
      this.timestamp = Date.now();
  };

  /**
   * Get a simple mnemonic name
   * @private
   */
  Peer.prototype.getMnemoname = function(dataBytes) {
      var mnemonic = new Mnemonic(64);
      mnemonic.random = [];
      mnemonic.random[0] = Bitcoin.convert.bytesToNum(dataBytes.slice(0,4));
      mnemonic.random[1] = Bitcoin.convert.bytesToNum(dataBytes.slice(8,16));
      var mnemoName = mnemonic.toWords().slice(0,4).join(" ");
      return mnemoName;

  };

  /**
   * Update last channel for this peer
   */
  Peer.prototype.updateChannel = function(channel) {
      this.channel = channel;
      this.timestamp = Date.now();
  };

  /**
   * Update this peer's public key
   */
  Peer.prototype.updateKey = function(pubKey) {
      if (!pubKey) throw Error('Update with no public key!');

      var fingerprint = Encryption.genFingerprint(pubKey);

      // Check this is the correct peer (it should be but to be sure..)
      if (this.fingerprint && fingerprint != this.fingerprint) {
          throw Error('Invalid update for peer!');
      }

      this.fingerprint = fingerprint;
      this.pubKeyHex = Bitcoin.convert.bytesToHex(pubKey);
      this.pubKey = pubKey;
      this.trusted = true;
      this.name = this.getMnemoname(pubKey);
  };

  return Peer;

});
