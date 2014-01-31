/*
 * Contacts
 */

/**
 * Contacts class.
 * @param {dict} store Object store
 * @constructor
 */
function Contacts(store) {
    this.store = store;
    if (!this.store.get('contacts')) {
        this.store.set('contacts', {});
    }
    this.contacts = this.store.get('contacts');
}

Contacts.prototype.addContact = function(name, data) {
    this.contacts[name] = data;
    this.store.save();
}
