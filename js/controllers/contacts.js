/**
 * @fileOverview ContactsCtrl angular controller
 */

angular.module('DarkWallet.controllers').controller('ContactsCtrl', ['$scope', function($scope) {
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