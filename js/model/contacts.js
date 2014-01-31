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
    if (!this.store.contacts) {
        this.store.contacts = {};
    }
}

Contacts.prototype.addContact = function(name, data) {
    this.store.contacts[name] = data;
    this.store.save();
}
