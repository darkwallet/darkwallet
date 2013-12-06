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

var load = function(callback) {
  callback = callback || function() {};
  var self = this;
  chrome.storage.local.get(self.constructor.name + "_" + self.key, function(obj) {
    obj = obj[self.constructor.name + "_" + self.key];
    for (var prop in obj) {
      self[prop] = obj[prop];
    }
    self._loaded = true;
    callback();
  });
}

var save = function(callback) {
  // @todo Encrypt data before saving it
  callback = callback || function() {};
  if (!this.key || !this._loaded) {
    callback(false);
  }
  var obj = {};
  obj[this.constructor.name + "_" + this.key] = this;
  chrome.storage.local.set(obj, callback);
}

Identity.prototype.load = 
Contact.prototype.load = 
Address.prototype.load = 
Transaction.prototype.load = load;

Identity.prototype.save = 
Contact.prototype.save = 
Address.prototype.save = 
Transaction.prototype.save = save;
