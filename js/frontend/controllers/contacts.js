/**
 * @fileOverview ContactsCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  controllers.controller('ContactsCtrl', ['$scope', '$routeParams', '$location', '$route', '$wallet', 'watch', '$history', 'notify', '_Filter',
      function($scope, $routeParams, $location, $route, $wallet, watch, $history, notify, _) {

  $scope.newContact = {};
  $scope.contactToEdit = {};
  $scope.contactFormShown = false;
  $scope.editingContact = false;
  $scope.contactSection = $routeParams.section || 'overview';

  // Check the route to see if we have to connect some contact
  var initRouteContact = function(identity) {
      if ($routeParams.contactId) {
          var id = parseInt($routeParams.contactId);
          if (identity.contacts.contacts[id]) {
              $scope.vars = { contact: identity.contacts.contacts[id] }
          } else {
              $location.path('/contacts');
          }
      }
  };

  // Don't reload the controller if coming from this tab
  // (only on contact.html template)
  var lastRoute = $route.current;
  if ($route.current.templateUrl.indexOf('contact.html') > 0) {
      $scope.$on('$locationChangeSuccess', function(event) {
          if ($route.current.templateUrl.indexOf('contact.html') > 0) {
              $scope.contactSection = $route.current.pathParams.section || 'overview';
              // Overwrite the route so the template doesn't reload
              $route.current = lastRoute;
          }
      });
  }

  // Set the contact section
  $scope.setContactSection = function(section) {
    var dest = '/contact/';
    if (section !== 'overview') {
        dest += section + '/';
    }
    $location.path(dest+$routeParams.contactId);
  };


  var identity = DarkWallet.getIdentity();
  if (identity) {
      initRouteContact(identity);
  }

  $scope.setCurrentPubKey = function(pubKey, i) {
      $scope.currentPubKey = pubKey;
      $scope.currentIndex = i;
  };

  $scope.contacts = identity.contacts.contacts.slice(0);
  $scope.allContacts = identity.contacts.contacts;

  $scope.contactSearch = '';

  var filterType = $scope.vars ? $scope.vars.type : false;

  var getContactTypes = function() {
    var types;
    if (filterType === 'any') {
        types = ['stealth', 'address', 'pubkey', 'id'];
    } else if (filterType === 'pubKey') {
        types = ['pubkey', 'stealth'];
    } else if (filterType === 'idKey') {
        types = ['id'];
    } else {
        types = ['stealth', 'address', 'pubkey'];
    }
    return types;
  };

  var findKey = function(contact, type) {
    var found;
    contact.pubKeys.some(function(key) {
        if (key.type == type) {
            found = key;
            return true;
        }
    });
    return found;
  };

  /**
   * Scope functions
   */
  $scope.pickContact = function(contact) {
    var types = getContactTypes();
    var key;
    if (!filterType) {
        // If looking for address get the main key
        key = contact.mainKey;
    } else if (filterType === 'any') {
        $scope.ok(contact);
        return;
    }
    // If we don't have a key yet look for one of the right types
    if (!key) {
        types.some(function(type) {
            var aKey = findKey(contact, type);
            if (aKey) {
                key = aKey;
                return true;
            }
        });
    }
    // Get the 'address' field for address search, otherwise get the data field
    var field = filterType ? 'data' : 'address';

    // Run the modal ok method
    $scope.ok(key[field]);
  };

  $scope.filterContacts = function() {
    var identity = DarkWallet.getIdentity();
    var search = $scope.contactSearch.toLowerCase();
    var types = getContactTypes();
    $scope.contacts = identity.contacts.contacts.filter(function(contact) {
        var hasType = contact.pubKeys.some(function(key) {
             return (types.indexOf(key.type) > -1);
        });
        return hasType && contact.data.name.toLowerCase().search(search) != -1;
    });
  };

  if (!$routeParams.contactId) {
    $scope.filterContacts();
  }

  var checkDuplicate = function(address) {
    var identity = DarkWallet.getIdentity();
    var parsed = identity.contacts.parseKey(address);
    var found = identity.contacts.findByAddress(parsed.address);
    // check for duplicate contact
    if (found) {
        notify.warning(_('Contact with that key already exists: {0}', found.data.name));
        return found;
    }
    // also see if this is ourselves
    found = identity.wallet.getWalletAddress(address);
    if (found) {
        notify.warning(_('This is yourself!'));
        return found;
    }
  }

  $scope.createContact = function(contactData) {
    var identity = DarkWallet.getIdentity();

    if (checkDuplicate(contactData.address)) {
        $scope.newContact = {};
        $scope.contactFormShown = false;
        return;
    }

    var newContact = identity.contacts.addContact(contactData);

    // add to scope
    $scope.contacts.push(newContact);

    $scope.newContact = {};
    $scope.contactFormShown = false;
    return newContact;
  };

  $scope.addContactKey = function(contact) {
    var address = $scope.newContact.address;
    var label = $scope.newContact.label;

    if (checkDuplicate(address)) {
        $scope.newContact = {};
        return;
    }

    var newKey = contact.addKey(address, label);

    // If pocket is watch only add the new address
    if (contact.data.watch) {
        watch.addKey(contact, newKey);
        $history.refreshAddresses();
    }

    // add to scope
    $scope.newContact = {};
  };


  $scope.openEditForm = function(contact, index, type) {
    $scope.contactToEdit = {name: contact.data.name, address: type?contact.pubKeys[index].label:contact.pubKeys[index].data, type: type};
    $scope.editingContact = index;
  };

  $scope.openContact = function(contact) {
    var identity = DarkWallet.getIdentity();
    var contactIndex = identity.contacts.contacts.indexOf(contact);;

    $location.path('/contact/'+contactIndex);
  };

  // Edit a contact's key
  $scope.editContactKey = function(contact, index) {
    var key = contact.pubKeys[index];
    if ($scope.contactToEdit.type === 'label') {
        // Edit label
        if (key.label !== $scope.contactToEdit.address) {
            // update the key
            key.label = $scope.contactToEdit.address;
            // rename the given address
            watch.renameKey(contact, key);
            // trigger saving and updating contact
            contact.update();
        }
    } else {
        // Edit address
        if (key.data !== $scope.contactToEdit.address) {
            // Don't allow duplicates
            if (checkDuplicate($scope.contactToEdit.address)) {
                $scope.editingContact = false;
                return;
            }

            // recreate and update the contact
            watch.removeKey(contact, key);
            contact.update($scope.contactToEdit.address, index);
            watch.addKey(contact, key);
            $history.refreshAddresses();
        }
    }
    $scope.editingContact = false;
  };

  // Set the name on a contact
  $scope.saveName = function(contact, name) {
    if (name !== contact.data.name) {
        var prevName = contact.data.name;
        contact.data.name = name;
        contact.update();
        if (watch.renamePocket(name, prevName)) {
            // update the scope
            $scope.updateReadOnly(DarkWallet.getIdentity());
        }
    }
    $scope.editingContact = false;
  };

  // Set the main key for a contact
  $scope.setMainKey = function(contact, index) {
    contact.setMainKey(index);
  };

  // Delete a contacts key
  $scope.deleteKey = function(contact, index) {
    // if watch remove the address from the wallet
    if (contact.data.watch) {
        watch.removeKey(contact, contact.pubKeys[index]);
        $history.refreshAddresses();
    }
    contact.deleteKey(index);
    // clear the contact in any related rows in case it came from this key
    $history.clearRowContacts(contact);
  };

  // Delete a contact
  $scope.deleteContact = function(contact) {
    if (contact.data.watch) {
        $history.removePocket('readonly', contact.data.name);
    }
    contact.remove();
    // remove from this scope
    var contactIndex = $scope.contacts.indexOf(contact);
    if (contactIndex > -1) {
        $scope.contacts.splice(contactIndex, 1);
    }
    // clear the contact in any related row
    $history.clearRowContacts(contact);
    // go to contacts
    $location.path('/contacts');
  };

  // Toggle watch on a contact
  $scope.toggleWatch = function(contact, index) {
    // toggle watch on the contact
    contact.data.watch = !contact.data.watch;

    // init or remove watching pocket
    contact.data.watch ? watch.initPocket(contact) : $history.removePocket('readonly', contact.data.name);

    // update the scope
    $scope.updateReadOnly(DarkWallet.getIdentity());
  };

}]);
});
