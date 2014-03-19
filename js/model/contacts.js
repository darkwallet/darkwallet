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
  this.contacts = this.store.init('contacts', {});
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
  this.contacts[data.address] = data;
  this.store.save();
};

/**
 * Edit a contact in the address book
 * @param {Object} data Contact information.
 */
Contacts.prototype.editContact = function (data) {
  this.updateContactHash(data);
  this.contacts[data.address] = data;
  this.store.save();
};


/**
 * Delete a contact from the address book
 * @param {String} data Contact information.
 */
Contacts.prototype.deleteContact = function (data) {
  delete this.contacts[data.address];
  this.store.save();
};

return Contacts;
});
