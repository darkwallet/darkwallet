'use strict';

define(['bitcoinjs-lib', 'util/btc', './contact'], function(Bitcoin, BtcUtils, Contact) {

var Crypto = Bitcoin.CryptoJS;

/**
 * Contacts (Address book).
 * @param {Object} store Object store
 * @constructor
 */
function Contacts(store, identity) {
  this.store = store;
  this.identity = identity
  this._contacts = this.store.init('contacts', [
    { name: 'DarkWallet team', address: '31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy' },
    { name: 'libbitcoin team', address: '339Bsc4f6jeh4k15difzbr4TTfoeS9uEKP' }
  ]);
  this.validAddresses = [
      identity.wallet.versions.address,
      identity.wallet.versions.stealth.address,
      identity.wallet.versions.p2sh
  ]
  this.contacts = this.initContacts();

  // revoke the libbitcoin old address
  var compromised = this.findByAddress('1Fufjpf9RM2aQsGedhSpbSCGRHrmLMJ7yY');
  if (compromised && compromised.pubKeys.length === 1) {
      // Changing compromised contact for libbitcoin to the old darkwallet fund,
      // controlled by a few trusted people.
      compromised.pubKeys[0].type = 'revoked';
      compromised.addKey('339Bsc4f6jeh4k15difzbr4TTfoeS9uEKP', null, true);
  }
}

/**
 * Update contacts after loading them.
 * @private
 */
Contacts.prototype.initContacts = function() {
  var contacts = [];
  var self = this;

  this._contacts.forEach(function(contact) {
      if (contact) {
          contacts.push(new Contact(contact, self));
      }
  });
  return contacts;
};

/**
 * Search for a contact
 */
Contacts.prototype.search = function(search) {
    var label = Object.keys(search)[0];
    var value = search[label];
    for(var i=0; i<this.contacts.length; i++) {
        if (this.contacts[i][label] === value) {
            return this.contacts[i];
        }
    }
}

/**
 * Create a key from an address string
 * @param {String} data Data with the address information
 */
Contacts.prototype.parseKey = function(data) {
  var pubKey;
  try {
      // for now show uncompressed for contacts from uncompressed pubkeys
      pubKey = BtcUtils.extractPublicKey(data, (data.length === 130) ? false : true);
  } catch (e) {
  }
  var newKey = {data: data, pubKey: pubKey, type: 'address'};

  var versions = this.identity.wallet.versions;
  if (data.slice(0,3) === 'PSI') {
      newKey.type = 'id';
  } else if (BtcUtils.isAddress(data, this.validAddresses)) {
      newKey.address = data;
      if (data[0] === versions.stealth.prefix) {
          newKey.type = 'stealth';
      }
  } else if (pubKey) {
      var pubKeyHash = Bitcoin.crypto.hash160(pubKey);
      var address = new Bitcoin.Address(pubKeyHash, versions.address).toString();
      newKey.address = address;
      newKey.type = 'pubkey';
  } else {
      console.log("cant decode address properly!");
      newKey.address = data;
      newKey.type = 'unknown';
  }
  return newKey;
};

/**
 * Generate fingerprint hash for some address
 * @param {String} address address to generate the hash from
 */
Contacts.prototype.generateAddressHash = function(address) {
    return Crypto.SHA256(address).toString();
};

/**
 * Generate fingerprint hash for some data
 * @param {String} data address or pubkey to generate the hash from
 */
Contacts.prototype.generateContactHash = function(data) {
    var newKey = this.parseKey(data);
    return this.generateAddressHash(newKey.address);
};


/**
 * Find Contact by pubkey
 * @param {Object} pubKey Public key to find.
 * @return {Object|null} The contact if it is there
 */
Contacts.prototype.findByPubKey = function (pubKey) {
  var toCheck = pubKey.toString();
  var compressed = (pubKey.length === 33);
  for(var i in this.contacts) {
    for(var j in this.contacts[i].pubKeys) {
      var address = this.contacts[i].pubKeys[j].data;
      var cPubKey;
      try {
          cPubKey = BtcUtils.extractPublicKey(address, compressed);
      } catch(e) {
          // not a good address
          continue;
      }
      if (cPubKey.toString() === toCheck) {
        return this.contacts[i];
      }
    }
  }
};


/**
 * Find Contact by address
 * @param {Object} address Address to find
 * @return {Object|null} The contact if it is there
 */
Contacts.prototype.findByAddress = function (address) {
  for(var i in this.contacts) {
    for(var j in this.contacts[i].pubKeys) {
      var cAddress = this.contacts[i].pubKeys[j].address;
      if (cAddress === address) {
        return this.contacts[i];
      }
    }
  }
};


/**
 * Add a contact to the address book
 * @param {Object} contact Contact information.
 */
Contacts.prototype.addContact = function (contact) {
  var newContact = new Contact(contact, this);
  this._contacts.push(newContact.data);
  this.contacts.push(newContact);
  this.store.save();
  return newContact;
};


/**
 * Delete a contact from the address book
 * @param {String} contact Contact information.
 * @throws {Error} When trying to delete a non-existing contact
 */
Contacts.prototype.deleteContact = function (contact) {
  var i = this.contacts.indexOf(contact);
  if (i === -1) {
    throw new Error("Contact does not exist!");
  }
  this._contacts.splice(this._contacts.indexOf(contact.data), 1);
  this.contacts.splice(i, 1);
  this.store.save();
};

return Contacts;
});
