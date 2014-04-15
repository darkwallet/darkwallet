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
    var search = $scope.contactSearch
    $scope.contacts = $scope.identity.contacts.contacts.filter(function(contact) {
        return contact.name.search(search) != -1;
    });
  }

  $scope.createContact = function() {
    $scope.identity.contacts.addContact($scope.newContact)
    $scope.newContact = {};
    $scope.contactFormShown = false;
  };

  $scope.openEditForm = function(i, contact) {
    $scope.contactFormShown = i;
    $scope.contactToEdit = {name: contact.name, address: contact.address};
  };

  $scope.editContact = function(contact) {
    contact.name = $scope.contactToEdit.name;
    contact.address = $scope.contactToEdit.address;
    $scope.identity.contacts.updateContact(contact);
    $scope.contactFormShown = false;
    $scope.contactToEdit = {};
  };

  $scope.deleteContact = function(contact) {
    $scope.identity.contacts.deleteContact(contact);
  };
}]);
});
