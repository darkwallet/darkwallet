'use strict';

define([], function() {

/**
 * Contact (Address book).
 * @param {Object} store Object store
 * @constructor
 */
function Contact(data, contacts) {
  this.data = data;
  this.contacts = contacts;
  this.initContact();
}

/**
 * Update fingerprint hash for a contact
 * @param {Object} contact Dictionary with a field address to feed the hash
 */
Contact.prototype.updateHash = function() {
    this.mainKey = this.pubKeys[this.data.mainKey];
    this.data.hash = this.contacts.generateAddressHash(this.mainKey.address);
};

/**
 * Find an idKey for the contact
 */
Contact.prototype.findIdentityKey = function () {
    for(var i=0; i<this.pubKeys.length; i++) {
        if (this.pubKeys[i].type == 'id') {
            return this.pubKeys[i];
        }
    }
};

/**
 * Update the internal reference to the current id key
 */
Contact.prototype.updateIdKey = function() {
    var idKey = this.findIdentityKey();
    if (idKey) {
        this.data.idKey = this.pubKeys.indexOf(idKey);
    } else if (this.data.idKey) {
        delete this.data.idKey;
    }
};

/**
 * Add a contact to the address book
 */
Contact.prototype.initContact = function () {
  if (this.data.pubKeys) {
      this.pubKeys = this.data.pubKeys;
      this.updateIdKey();
      if (this.data.mainKey !== undefined) {
          this.mainKey = this.pubKeys[this.data.mainKey];
      }
      return;
  }
  this.data.pubKeys = [];
  this.pubKeys = this.data.pubKeys;

  this.updateKey(this.data.address, 0);
  delete this.data.address;
  this.data.mainKey = 0;

  this.updateIdKey();
  this.updateHash();
};


/**
 * Add key
 */
Contact.prototype.addKey = function (data, label, main) {
  var newKey = this.contacts.parseKey(data);

  if (label) {
      newKey.label = label;
  }
  this.pubKeys.push(newKey);
  if (main) {
      this.data.mainKey = this.pubKeys.length-1;
      this.updateHash();
  }
  this.updateIdKey();
  this.contacts.store.save();
  // delete address since now is contained inside this.pubKeys
};

/**
 * Sets key index as main key
 * Will also update the contact hash to reflect new main identity.
 */
Contact.prototype.setMainKey = function (index) {
    if (index >= this.pubKeys.length) {
       throw new Error("Key does not exist");
    }
    this.data.mainKey = index;
    this.updateHash();
    this.contacts.store.save();
};

/**
 * Delete contact key
 */
Contact.prototype.deleteKey = function (index) {
  this.pubKeys.splice(index, 1);
  if (this.data.mainKey > this.pubKeys.length) {
      this.data.mainKey = this.pubKeys.length-1;
  }
  this.updateHash();
  // Check if we have an idkey
  this.updateIdKey();
  this.contacts.store.save();
};
 

/**
 * Update a key from given user input
 */
Contact.prototype.updateKey = function (data, index) {
  var newKey = this.contacts.parseKey(data);

  if (!this.pubKeys || !this.pubKeys.length) {
      if (index) {
          throw Error("Trying to update key with index from contact with no keys");
      }
      this.pubKeys.push(newKey);
  } else {
      for(var par in newKey) {
          this.pubKeys[index][par] = newKey[par];
      }
  }
};


/**
 * Edit a contact in the address book
 * @param {Object} contact Contact information.
 * @throws {Error} When trying to update a non-existing contact
 */
Contact.prototype.update = function (data, index) {
  if (data) {
    this.updateKey(data, index);
    this.updateHash();
  }

  this.contacts.store.save();
};


/**
 * Delete a contact from the address book
 * @param {String} contact Contact information.
 * @throws {Error} When trying to delete a non-existing contact
 */
Contact.prototype.remove = function () {
  this.contacts.deleteContact(this);
};

return Contact;
});
