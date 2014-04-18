/**
 * @fileOverview ContactsCtrl angular controller
 */

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  'use strict';
  controllers.controller('ContactsCtrl', ['$scope', '$routeParams', '$location', function($scope, $routeParams, $location) {

  $scope.newContact = {};
  $scope.contactToEdit = {};
  $scope.contactFormShown = false;

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
    var search = $scope.contactSearch;
    $scope.contacts = identity.contacts.contacts.filter(function(contact) {
        return contact.name.search(search) != -1;
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

  $scope.openEditForm = function(contact) {
    $scope.contactToEdit = {name: contact.name, address: contact.address};
  };

  $scope.openContact = function(contact) {
    // $scope.openModal('show-contact', {contact: contact});
    var identity = DarkWallet.getIdentity();
    var contactIndex = identity.contacts.contacts.indexOf(contact);;

    $location.path('/contact/'+contactIndex);
  }

  $scope.editContact = function(contact) {
    var identity = DarkWallet.getIdentity();
    contact.name = $scope.contactToEdit.name;
    contact.address = $scope.contactToEdit.address;
    identity.contacts.updateContact(contact);
  };

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
