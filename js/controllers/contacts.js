/**
 * @fileOverview ContactsCtrl angular controller
 */

define(['./module'], function (controllers) {
  'use strict';
  controllers.controller('ContactsCtrl', ['$scope', '$modal', function($scope, $modal) {
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

  var ConfirmInstanceCtrl = function ($scope, $modalInstance, contact) {
    $scope.contact = contact;
    $scope.ok = function () {
      $modalInstance.close();
    };
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  };

  $scope.deleteContact = function(contact) {
    $modal.open({
      templateUrl: 'confirm.html',
      controller: ConfirmInstanceCtrl,
      resolve: {
        contact:  function() {
          return contact
        }
      }
    }).result.then(function() {
      $scope.identity.contacts.deleteContact(contact);
    });
  };
}]);
});