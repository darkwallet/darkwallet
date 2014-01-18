/**
 * @fileOverview Classes.
 */


/**
 * Identity class.
 * @param {string} id Identifier for this identity.
 * @constructor
 */
function Identity(id) {
  this.id = this.key = id;
  return this;
};


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


/**
 * Database constructor.
 * @param {string|Array.<string>|Object} name Optional string or array of string
 *   or object.  Consider renaming to 'keys' to match API.
 *   @see  http://developer.chrome.com/extensions/storage.html#type-StorageArea
 * @param {string} password Password.
 * @param {Function} callback Function executed on load / save.
 * @constructor
 */
Database = function(keys, password, callback) {
  var callback = callback || function(){};
  this.name = name;
  this.password = password;
  this.data = {};
  var self = this;
  chrome.storage.local.get(name, function(obj) {
    if (!obj || !obj[name]) {
      console.log('Creating database');
      self._save(callback);
    } else {
      console.log('Loading database');
      self._load(callback);
    }
  });
};


/**
 * Loads JSON data object into this.data.
 * @param {Function} callback Function executed on after data loaded.
 * @private
 */
Database.prototype._load = function(callback) {
  var callback = callback || function(){};
  var self = this;
  chrome.storage.local.get(this.name, function(obj) {
    try {
      self.data = JSON.parse(sjcl.decrypt(self.password, obj[self.name]));
      callback();
    } catch(e) {
      callback(true);
    }
  });
};


/**
 * Saves JSON data object into local database.
 * @param {Function} callback Function executed on after data saved.
 * @private
 */
Database.prototype._save = function(callback) {
  var callback = callback || function(){};
  try {
    var cipher = sjcl.encrypt(this.password, JSON.stringify(this.data));
    var obj = {};
    obj[this.name] = cipher;
    chrome.storage.local.set(obj, function() {
      callback();
    });
  } catch(e) {
    callback(true);
  }
};


/**
 * Adds a new field to the database.
 * @param {string} key Key for the new field.  Must be unique.
 * @param {Object} obj Data object to be saved.
 * @param {Function} callback Function executed on after data saved.
 */
Database.prototype.create = function(key, obj, callback) {
  var self = this;
  var callback = callback || function(){};
  this._load(function() {
    if (typeof self.data[key] != 'undefined') {
      throw new Error(key + ' already exists in database.');
    }
    self.data[key] = obj;
    self._save(callback);
  });
};


/**
 * Reads in the data object for specified key.
 * @param {string?} key Key for the field or null.
 * @param {Function} callback Function called with the requested data.
 */
Database.prototype.read = function(key, callback) {
  var self = this;
  var callback = callback || function(){};
  this._load(function() {
    if (key === null) {
      callback(self.data);
    } else {
      callback(self.data[key]);
    }
  });
};


/**
 * Updates an existing field.
 * @param {string?} key Key for the field or null.
 * @param {Object} obj Data object to be written to database.
 * @param {Function} callback Function called after database is updated.
 */
Database.prototype.update = function(key, obj, callback) {
  var self = this;
  var callback = callback || function(){};
  this._load(function() {
    if (typeof self.data[key] == 'undefined') {
      throw new Error(key + ' is not previously present in database.');
    }
    self.data[key] = obj;
    self._save(callback);
  });
};


/**
 * Removes an item from database.
 * @param {string} key Key for the field.
 * @param {Function} callback Function called after data is removed.
 */
Database.prototype.remove = function(key, callback) {
  var self = this;
  var callback = callback || function(){};
  this._load(function() {
    delete self.data[key];
    self._save(callback);
  });
};
