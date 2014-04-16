/**
 * @fileOverview ContactsCtrl angular controller
 */

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  'use strict';
  controllers.controller('ContactsCtrl', ['$scope', function($scope) {
  $scope.newContact = {};
  $scope.contactToEdit = {};
  $scope.contactFormShown = false;

  var identity = DarkWallet.getIdentity();

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

  $scope.openEditForm = function(i, contact) {
    $scope.contactFormShown = i;
    $scope.contactToEdit = {name: contact.name, address: contact.address};
  };

  $scope.editContact = function(contact) {
    var identity = DarkWallet.getIdentity();
    contact.name = $scope.contactToEdit.name;
    contact.address = $scope.contactToEdit.address;
    identity.contacts.updateContact(contact);
    $scope.contactFormShown = false;
    $scope.contactToEdit = {};
  };

  $scope.deleteContact = function(contact) {
    var identity = DarkWallet.getIdentity();
    identity.contacts.deleteContact(contact);
  };
}]);
});
