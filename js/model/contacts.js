/**
 * @fileOverview Contacts (Address book).
 */

/**
 * Contacts class.
 * @param {Object} store Object store
 * @constructor
 */
function Contacts(store) {
    this.store = store;
    if (!this.store.get('contacts')) {
        this.store.set('contacts', {});
    }
    this.contacts = this.store.get('contacts');
}

/**
 * Add a contact to the address book
 * @param {String} name Contact name.
 * @param {Object} data Contact information.
 */
Contacts.prototype.addContact = function(name, data) {
    this.contacts[name] = data;
    this.store.save();
}
