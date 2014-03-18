/**
 * @fileOverview ContactsCtrl angular controller
 */

define(['./module'], function (controllers) {
  'use strict';
  controllers.controller('ContactsCtrl', ['$scope', function($scope, $modal) {
  $scope.newContact = {};
  $scope.contactFormShown = false;

  $scope.createContact = function() {
    $scope.identity.contacts.addContact($scope.newContact)
    $scope.newContact = {};
    $scope.contactFormShown = false;
  };

  $scope.editContact = function(contact) {
    $scope.identity.contacts.editContact(contact);
    $scope.contactFormShown = false;
  };

  $scope.deleteContact = function(contact) {
    $scope.identity.contacts.deleteContact(contact);
  };
}]);
});