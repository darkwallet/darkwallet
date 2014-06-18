/**
 * @fileOverview ContactsCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  controllers.controller('ContactsCtrl', ['$scope', '$routeParams', '$location', function($scope, $routeParams, $location) {

  $scope.newContact = {};
  $scope.contactToEdit = {};
  $scope.contactFormShown = false;
  $scope.editingContact = false;
  $scope.contactSection = 'overview';

  // Check the route to see if we have to connect some contact
  var initRouteContact = function(identity) {
      if ($routeParams.contactId) {
          if (identity.contacts.contacts[$routeParams.contactId]) {
              $scope.vars = { contact: identity.contacts.contacts[$routeParams.contactId] }
          } else {
              $location.path('/contacts');
          }
      }
  }

  var identity = DarkWallet.getIdentity();
  if (identity) {
      initRouteContact(identity);
  }

  $scope.setCurrentPubKey = function(pubKey, i) {
      $scope.currentPubKey = pubKey;
      $scope.currentIndex = i;
  }

  $scope.contacts = identity.contacts.contacts.slice(0);
  $scope.allContacts = identity.contacts.contacts;

  $scope.contactSearch = '';

  var filterType = $scope.vars ? $scope.vars.type : false;

  var getContactTypes = function() {
    var types;
    if (filterType == 'pubKey') {
        types = ['pubkey', 'stealth'];
    } else if (filterType == 'idKey') {
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
  }

  $scope.pickContact = function(contact) {
    var types = getContactTypes();
    var key;
    if (!filterType) {
        // If looking for address get the main key
        key = contact.mainKey;
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
  }

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

  $scope.createContact = function() {
    var identity = DarkWallet.getIdentity();

    var newContact = identity.contacts.addContact($scope.newContact);

    // add to scope
    $scope.contacts.push(newContact);

    $scope.newContact = {};
    $scope.contactFormShown = false;
  };

  $scope.addContactKey = function(contact) {
    var address = $scope.newContact.address;
    var label = $scope.newContact.label;

    contact.addKey(address, label);

    // add to scope
    $scope.newContact = {};
  };


  $scope.openEditForm = function(contact, index) {
    $scope.contactToEdit = {name: contact.data.name, address: contact.pubKeys[index].data};
    $scope.editingContact = index;
  };

  $scope.openContact = function(contact) {
    // modals.open('show-contact', {contact: contact});
    var identity = DarkWallet.getIdentity();
    var contactIndex = identity.contacts.contacts.indexOf(contact);;

    $location.path('/contact/'+contactIndex);
  }

  $scope.saveName = function(contact, name) {
    contact.data.name = name;
    contact.update();
    $scope.editingContact = false;
  }

  $scope.editContact = function(contact, index) {
    contact.data.name = $scope.contactToEdit.name;
    contact.update($scope.contactToEdit.address, index);
    $scope.editingContact = false;
  };

  $scope.toggleWatch = function(contact, index) {
    contact.data.watch = !contact.data.watch;
  }

  $scope.setMainKey = function(contact, index) {
    contact.setMainKey(index);
  }

  $scope.deleteKey = function(contact, index) {
    contact.deleteKey(index);
  }

  $scope.deleteContact = function(contact) {
    contact.remove();
    var contactIndex = $scope.contacts.indexOf(contact);
    if (contactIndex > -1) {
        $scope.contacts.splice(contactIndex, 1);
    }
    $location.path('/contacts');
  };
}]);
});
