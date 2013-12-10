function Identity(id) {
  this.id = this.key = id;
  return this;
}

function Contact(address) {
  this.address = this.key = address;
  return this;
}

function Address(address) {
  this.address = this.key = address;
  return this;
}

function Transaction(tx) {
  this.tx = this.key = tx;
  return this;
}

Database = function(name, password, callback) {
  var callback = callback || function(){};
  this.name = name;
  this.password = password;
  this.data = {};
  var self = this;
  chrome.storage.local.get(name, function(obj) {
    if (!obj || !obj[name]) {
      console.log("Creating database");
      self._save(callback);
    } else {
      console.log("Loading database");
      self._load(callback);
    }
  });
}

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
}

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
}

Database.prototype.create = function(key, obj, callback) {
  var self = this;
  var callback = callback || function(){};
  this._load(function() {
    if (typeof self.data[key] != "undefined") {
      throw new Error(key + " already exists in database.");
    }
    self.data[key] = obj;
    self._save(callback);
  });
}

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
}

Database.prototype.update = function(key, obj, callback) {
  var self = this;
  var callback = callback || function(){};
  this._load(function() {
    if (typeof self.data[key] == "undefined") {
      throw new Error(key + " is not previously present in database.");
    }
    self.data[key] = obj;
    self._save(callback);
  });
}

Database.prototype.remove = function(key, callback) {
  var self = this;
  var callback = callback || function(){};
  this._load(function() {
    delete self.data[key];
    self._save(callback);
  });
}

