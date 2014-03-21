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

  $scope.editContact = function(i, contact) {
    $scope.identity.contacts.editContact(contact, i);
    $scope.contactFormShown = false;
  };

  $scope.deleteContact = function(i) {
    $scope.identity.contacts.deleteContact(i);
  };
}]);
});