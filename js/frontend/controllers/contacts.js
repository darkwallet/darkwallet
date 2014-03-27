/**
 * @fileOverview ContactsCtrl angular controller
 */

define(['./module'], function (controllers) {
  'use strict';
  controllers.controller('ContactsCtrl', ['$scope', function($scope) {
  $scope.newContact = {};
  $scope.contactToEdit = {};
  $scope.contactFormShown = false;

  $scope.createContact = function() {
    $scope.identity.contacts.addContact($scope.newContact)
    $scope.newContact = {};
    $scope.contactFormShown = false;
  };

  $scope.openEditForm = function(i, contact) {
    $scope.contactFormShown = i;
    $scope.contactToEdit = {name: contact.name, address: contact.address};
  };

  $scope.editContact = function(i, contact) {
    contact.name = $scope.contactToEdit.name;
    contact.address = $scope.contactToEdit.address;
    $scope.identity.contacts.editContact(i, contact);
    $scope.contactFormShown = false;
    $scope.contactToEdit = {};
  };

  $scope.deleteContact = function(i) {
    $scope.identity.contacts.deleteContact(i);
  };
}]);
});
