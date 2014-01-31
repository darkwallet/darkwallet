/**
 * Contact class.
 * @param {string} address Contact's address.
 * @constructor
 */
function Contact(address) {
  this.address = this.key = address;
  return this;
};


/**
 * Address class used by Contact.
 * @param {string} address An address.
 * @constructor
 */
function Address(address) {
  this.address = this.key = address;
  return this;
};


/**
 * Transaction class.
 * @param {string} tx Text.
 * @constructor
 */
function Transaction(tx) {
  this.tx = this.key = tx;
  return this;
}


