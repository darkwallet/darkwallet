/**
 * @fileOverview Contacts (Address book).
 */

define(['bitcoinjs-lib'], function(Bitcoin) {

var Crypto = Bitcoin.Crypto;

/**
 * Contacts class.
 * @param {Object} store Object store
 * @constructor
 */
function Contacts(store) {
  this.store = store;
  this.contacts = this.store.init('contacts', []);
  // TODO Remove when Darkwallet 1.0 release
  if (!Array.isArray(this.contacts)) {
    this.contacts = [];
    this.store.set('contacts', this.contacts);
    this.store.save();
  }
  this.updateContacts();
}

/**
 * Update contacts after loading them.
 * @private
 */
Contacts.prototype.updateContacts = function() {
  var self = this;
  Object.keys(this.contacts).forEach(function(contactId) {
      var contact = self.contacts[contactId];
      if (!contact.hash) {
          self.updateContactHash(contact);
      }
  });
}

/**
 * Update fingerprint hash for a contact
 */
Contacts.prototype.updateContactHash = function(contact) {
    contact.hash = Crypto.SHA256(contact.address).toString();
}

/**
 * Add a contact to the address book
 * @param {Object} data Contact information.
 */
Contacts.prototype.addContact = function (data) {
  this.updateContactHash(data);
  this.contacts.push(data);
  this.store.save();
};

/**
 * Edit a contact in the address book
 * @param {Object} data Contact information.
 */
Contacts.prototype.editContact = function (i, data) {
  this.updateContactHash(data);
  this.contacts[i] = data;
  this.store.save();
};


/**
 * Delete a contact from the address book
 * @param {String} data Contact information.
 */
Contacts.prototype.deleteContact = function (i) {
  this.contacts.splice(i, 1);
  this.store.save();
};

return Contacts;
});
