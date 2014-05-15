'use strict';

define(['bitcoinjs-lib', 'util/encryption'],
function (Bitcoin, Encryption) {

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
  };
  
  /**
   * Generates a readable word from a number.
   * @param {Number} data
   * @returns {String}
   * @private
   */
  Peer.prototype.generateWord = function(data) {
      var vowels = 'aeiou'.split('');
      var consonants = 'bcdfghjklmnpqrstvwxyz'.split('');
      consonants = consonants.concat(["ch", "sh", "th", "zh"]);
      
      var name = '';
      var i = 0 ;
      
      var capitaliseFirstLetter = function(string) {
          return string.charAt(0).toUpperCase() + string.slice(1);
      };

      while(data > 1) {
        if (i%2 === 1) {
          name += vowels[data%vowels.length];
          data = parseInt(data/vowels.length);
        } else {
          name += consonants[data%consonants.length];
          data = parseInt(data/consonants.length);
        }
        i++;
      }
      return capitaliseFirstLetter(name);
  };

  /**
   * Get a simple mnemonic name
   * @private
   */
  Peer.prototype.getMnemoname = function(dataBytes) {
      var data1 = Bitcoin.convert.bytesToNum(dataBytes.slice(0,2));
      var data2 = Bitcoin.convert.bytesToNum(dataBytes.slice(8,11));
      return this.generateWord(data1) + ' ' + this.generateWord(data2);
  };

  /**
   * Update last channel for this peer
   */
  Peer.prototype.updateChannel = function(channel) {
      this.channel = channel;
  };

  /**
   * Update this peer's public key
   */
  Peer.prototype.updateKey = function(pubKey) {
      if (!pubKey) throw Error("Update with no public key!");

      var fingerprint = Encryption.genFingerprint(pubKey);
      // Check this is the correct peer (it should be but to be sure..)
      if (this.fingerprint && fingerprint != this.fingerprint) {
          throw Error("Invalid update for peer!");
      }

      this.fingerprint = fingerprint;
      this.pubKeyHex = Bitcoin.convert.bytesToHex(pubKey);
      this.pubKey = pubKey;
      this.trusted = true;
      this.name = this.getMnemoname(pubKey);
  };

  return Peer;

});
