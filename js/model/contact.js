'use strict';

define([], function() {

/**
 * Contact (Address book).
 * @param {Object} data Object store (new dictionary or a dict from the store)
 * @param {Contacts} contacts Parent contacts object
 * @constructor
 */
function Contact(data, contacts) {
  this.data = data;
  this.contacts = contacts;
  this.initTrust();
  this.initContact();
}

/**
 * Init trust for this contact
 */
Contact.prototype.initTrust = function() {
  // initialize trust
  if (!this.data.trust) {
      // order is trust, opsec and validation
      this.data.trust = [0, 0, 0];
  }
  this.trust = {};
  var keys = ['trust', 'opsec', 'validation'];
  var self = this;
  this.data.trust.forEach(function(value, i) {
      var key = keys[i];
      self.trust[key] = value;
  });
}

/**
 * Set trust on a contact
 * @param {Object} newTrust Mapping with keys to set
 * keys are:
 * - trust: -1 to 4
 * - opsec: -2 to 4
 * - validation: 0 to 3
 */
Contact.prototype.setTrust = function(newTrust) {
  var self = this;
  var keys = ['trust', 'opsec', 'validation'];
  keys.forEach(function(key, i) {
      var value = newTrust[key];
      if (value !== undefined && value !== null) {
          self.data.trust[i] = parseInt(value);
          self.trust[key] = parseInt(value)
      }
  });
  this.contacts.store.save();
}

/**
 * Initialize a contact
 */
Contact.prototype.initContact = function () {
  // Loaded from store
  if (this.data.pubKeys) {
      this.pubKeys = this.data.pubKeys;
      this.updateIdKey();
      if (this.data.mainKey !== undefined) {
          this.mainKey = this.pubKeys[this.data.mainKey];
      }
      return;
  }
  // Creating a brand new contact
  this.data.pubKeys = [];
  this.pubKeys = this.data.pubKeys;

  // On first create data for the address comes in data.address
  // We use updateKey so we don't trigger save here.
  this.updateKey(this.data.address, 0);

  // delete address since now is contained inside this.pubKeys
  delete this.data.address;

  // Set the just created key as our main key
  this.data.mainKey = 0;

  this.updateIdKey();
  this.updateHash();
};

/**
 * Update fingerprint hash for a contact
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
        if (this.pubKeys[i].type === 'id') {
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
 * Add key
 * @param {String} data Data for the key to add
 * @param {String} label Label for the key
 * @param {Bool} main Set the key as main
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
  return newKey;
};

/**
 * Sets key index as main key
 * @param {Number} index Index for the key to set as main,
 *                 should be something we can pay to.
 * Will also update the contact hash to reflect new main identity.
 */
Contact.prototype.setMainKey = function (index) {
    if (index >= this.pubKeys.length) {
       throw new Error('Key does not exist');
    }
    this.data.mainKey = index;
    this.updateHash();
    this.contacts.store.save();
};

/**
 * Delete contact key
 * @param {Number} index Index for the key to delete
 */
Contact.prototype.deleteKey = function (index) {
  this.pubKeys.splice(index, 1);
  if (this.data.mainKey > index) {
      this.data.mainKey = this.data.mainKey-1;
  }
  this.updateHash();
  // Check if we have an idkey
  this.updateIdKey();
  this.contacts.store.save();
};
 

/**
 * Update a key from given user input
 * @param {String} data Data for the update
 * @param {Number} index Index for the key to update
 * @throws {Error} When the contact has no pubKeys and index is greater than 0
 */
Contact.prototype.updateKey = function (data, index) {
  var newKey = this.contacts.parseKey(data);

  if (!this.pubKeys.length) {
      if (index) {
          throw new Error('Trying to update key with index from contact with no keys');
      }
      this.pubKeys.push(newKey);
  } else {
      for(var par in newKey) {
          this.pubKeys[index][par] = newKey[par];
      }
  }
};


/**
 * Edit a contact key and save contact
 * @param {String} data Data for the update
 * @param {Number} index Index for the key to update
 */
Contact.prototype.update = function (data, index) {
  if (data) {
    this.updateKey(data, index);
    this.updateHash();
  }

  this.contacts.store.save();
};


/**
 * Delete this contact and remove from the parent contacts.
 */
Contact.prototype.remove = function () {
  this.contacts.deleteContact(this);
};

return Contact;
});
