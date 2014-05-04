'use strict';

define(['bitcoinjs-lib', 'util/btc'], function(Bitcoin, BtcUtils) {

var Crypto = Bitcoin.CryptoJS;

/**
 * Contacts (Address book).
 * @param {Object} store Object store
 * @constructor
 */
function Contacts(store, identity) {
  this.store = store;
  this.identity = identity
  this.contacts = this.store.init('contacts', [
    { name: 'DarkWallet team', address: '31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy' }
 //   { name: 'libbitcoin team', address: '1Fufjpf9RM2aQsGedhSpbSCGRHrmLMJ7yY' }
  ]);
  this.validAddresses = [
      identity.wallet.versions.address,
      identity.wallet.versions.stealth.address,
      identity.wallet.versions.p2sh
  ]
  this.initContacts();
  // revoke the libbitcoin old address
  var compromised = this.findByAddress('1Fufjpf9RM2aQsGedhSpbSCGRHrmLMJ7yY');
  if (compromised && compromised.pubKeys.length == 1) {
      // Changing compromised contact for libbitcoin to the old darkwallet fund,
      // controlled by a few trusted people.
      compromised.pubKeys[0].type = 'revoked';
      this.addContactKey(compromised, '32wRDBezxnazSBxMrMqLWqD1ajwEqnDnMc', true);
  }
}

/**
 * Update contacts after loading them.
 * @private
 */
Contacts.prototype.initContacts = function() {
  var self = this;
  var updated;

  // TODO Remove when Darkwallet 1.0 release
  this.contacts.forEach(function(contact) {
      if (!contact) {
          return;
      }
      if (!contact.pubKeys) {
          self.updateKey(contact, contact.address, 0);
          contact.mainKey = 0;
          updated = true;
          self.updateContactHash(contact);
          // delete address since now is contained inside contact.pubKeys
          delete contact.address;
      }
  });
  if (updated) {
    console.log("updated contacts", this.contacts);
    // this.store.save();
  }
};

/**
 * Update address for a contact
 * @param {Object} contact Dictionary with a field address to feed the hash
 */
Contacts.prototype.prepareAddress = function(data) {
  var addresses = []; // {pubKey: ..., address: ..., data: ..., type: ...}
  var pubKey;
  try {
      // for now show uncompressed for contacts from uncompressed pubkeys
      pubKey = BtcUtils.extractPublicKey(data, (data.length == 130) ? false : true);
  } catch (e) {
  }
  var newKey = {data: data, pubKey: pubKey, type: 'address'};

  if (BtcUtils.isAddress(data, this.validAddresses)) {
      newKey.address = data;
      if (data[0] == this.identity.wallet.versions.stealth.prefix) {
          newKey.type = 'stealth';
      }
  } else if (pubKey) {
      var pubKeyHash = Bitcoin.crypto.hash160(pubKey);
      var address = new Bitcoin.Address(pubKeyHash, this.identity.wallet.versions.address).toString();
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
 * Update fingerprint hash for a contact
 * @param {Object} contact Dictionary with a field address to feed the hash
 */
Contacts.prototype.updateContactHash = function(contact) {
    contact.hash = this.generateAddressHash(contact.pubKeys[contact.mainKey].address);
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
    var newKey = this.prepareAddress(data);
    return Crypto.SHA256(newKey.address).toString();
};


/**
 * Find Contact by pubkey
 * @param {Object} pubKey Public key to find.
 * @return {Object|null} The contact if it is there
 */
Contacts.prototype.findByPubKey = function (pubKey) {
  var toCheck = pubKey.toString();
  var compressed = (pubKey.length == 33);
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
      if (cPubKey.toString() == toCheck) {
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
      if (cAddress == address) {
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
  contact.pubKeys = [];

  this.updateKey(contact, contact.address, 0);
  delete contact.address;
  contact.mainKey = 0;

  this.updateContactHash(contact);
  this.contacts.push(contact);
  this.store.save();
};

/**
 * Add key
 */
Contacts.prototype.addContactKey = function (contact, data, main) {
  var newKey = this.prepareAddress(data);

  if (!contact.pubKeys) {
      contact.pubKeys = [];
  }
  contact.pubKeys.push(newKey);
  if (main) {
      contact.mainKey = contact.pubKeys.length-1;
  }
  this.store.save();
  // delete address since now is contained inside contact.pubKeys
};

/**
 * Sets key index as main key
 * Will also update the contact hash to reflect new main identity.
 */
Contacts.prototype.setMainKey = function (contact, index) {
    if (index >= contact.pubKeys.length) {
       throw Error("Key does not exist");
    }
    contact.mainKey = index;
    this.updateContactHash(contact);
    this.store.save();
}
 

/**
 * Update a key from given user input
 */
Contacts.prototype.updateKey = function (contact, data, index) {
  var newKey = this.prepareAddress(data);

  if (!contact.pubKeys || !contact.pubKeys.length) {
      if (index) {
          throw Error("Trying to update key with index from contact with no keys");
      }
      contact.pubKeys = [newKey];
  } else {
      for(var par in newKey) {
          contact.pubKeys[index][par] = newKey[par];
      }
  }
};


/**
 * Edit a contact in the address book
 * @param {Object} contact Contact information.
 * @throws {Error} When trying to update a non-existing contact
 */
Contacts.prototype.updateContact = function (contact, data, index) {
  if (this.contacts.indexOf(contact) == -1) {
    throw Error("This is not an already existing contact!");
  }

  if (data) {
    this.updateKey(contact, data, index);
  }
  this.updateContactHash(contact);

  this.store.save();
};


/**
 * Delete a contact from the address book
 * @param {String} contact Contact information.
 * @throws {Error} When trying to delete a non-existing contact
 */
Contacts.prototype.deleteContact = function (contact) {
  var i = this.contacts.indexOf(contact);
  if (i == -1) {
    throw Error("Contact does not exist!");
  }
  this.contacts.splice(i, 1);
  this.store.save();
};

return Contacts;
});
