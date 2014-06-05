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

  $scope.contacts = identity.contacts.contacts.slice(0);
  $scope.allContacts = identity.contacts.contacts;

  $scope.contactSearch = '';

  $scope.filterContacts = function() {
    var identity = DarkWallet.getIdentity();
    var search = $scope.contactSearch.toLowerCase();
    $scope.contacts = identity.contacts.contacts.filter(function(contact) {
        return contact.name.toLowerCase().search(search) != -1;
    });
  };

  $scope.createContact = function() {
    var identity = DarkWallet.getIdentity();
    var newContact = $scope.newContact;

    identity.contacts.addContact(newContact);

    // add to scope
    $scope.contacts.push(newContact);

    $scope.newContact = {};
    $scope.contactFormShown = false;
  };

  $scope.addContactKey = function(contact) {
    var identity = DarkWallet.getIdentity();
    var name = $scope.newContact.name;
    var address = $scope.newContact.address;

    identity.contacts.addContactKey(contact, address);

    // add to scope
    $scope.newContact = {};
  };


  $scope.openEditForm = function(contact, index) {
    $scope.contactToEdit = {name: contact.name, address: contact.pubKeys[index].data};
    $scope.editingContact = index;
  };

  $scope.openContact = function(contact) {
    // modals.open('show-contact', {contact: contact});
    var identity = DarkWallet.getIdentity();
    var contactIndex = identity.contacts.contacts.indexOf(contact);;

    $location.path('/contact/'+contactIndex);
  }

  $scope.saveName = function(contact, name) {
    var identity = DarkWallet.getIdentity();
    contact.name = name;
    identity.contacts.updateContact(contact);
    $scope.editingContact = false;
  }

  $scope.editContact = function(contact, index) {
    var identity = DarkWallet.getIdentity();
    contact.name = $scope.contactToEdit.name;
    identity.contacts.updateContact(contact, $scope.contactToEdit.address, index);
    $scope.editingContact = false;
  };

  $scope.toggleWatch = function(contact, index) {
    contact.watch = !contact.watch;
  }

  $scope.setMainKey = function(contact, index) {
    var identity = DarkWallet.getIdentity();
    identity.contacts.setMainKey(contact, index);
  }

  $scope.deleteKey = function(contact, index) {
    var identity = DarkWallet.getIdentity();
    identity.contacts.deleteKey(contact, index);
  }

  $scope.deleteContact = function(contact) {
    var identity = DarkWallet.getIdentity();
    identity.contacts.deleteContact(contact);
    var contactIndex = $scope.contacts.indexOf(contact);
    if (contactIndex > -1) {
        $scope.contacts.splice(contactIndex, 1);
    }
    $location.path('/contacts');
  };
}]);
});
