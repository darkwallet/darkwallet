/**
 * @fileOverview Contacts (Address book).
 */

define(function() {
/**
 * Contacts class.
 * @param {Object} store Object store
 * @constructor
 */
function Contacts(store) {
  this.store = store;
  this.contacts = this.store.init('contacts', {});
}

/**
 * Add a contact to the address book
 * @param {Object} data Contact information.
 */
Contacts.prototype.addContact = function (data) {
  this.contacts[data.address] = data;
  this.store.save();
};

/**
 * Edit a contact in the address book
 * @param {Object} data Contact information.
 */
Contacts.prototype.editContact = function (data) {
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