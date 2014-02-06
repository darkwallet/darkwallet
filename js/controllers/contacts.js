/**
 * @fileOverview ContactsCtrl angular controller
 */

function ContactsCtrl($scope) {
  $scope.newContact = {};
  $scope.createContact = function() {
      if ($scope.subsection == 'edit') {
          // XXX doesn't work if name has changed!
          $scope.identity.contacts.addContact($scope.newContact.name, $scope.newContact)
      } else {
          $scope.identity.contacts.addContact($scope.newContact.name, $scope.newContact)
      }
      $scope.subsection = '';
  }
  $scope.editContact = function(contact) {
      var keys = Object.keys(contact);
      for(var idx=0; idx<keys.length; idx++) {
          $scope.newContact[keys[idx]] = contact[keys[idx]];
      }
      $scope.subsection = 'edit'; 
  }
  $scope.deleteContact = function(contact) {
      $scope.identity.contacts.deleteContact(contact.name);
      console.log(contact);
  }
  $scope.startCreateContact = function() {
      $scope.newContact = {};
      $scope.subsection = 'create'; 
  }
}

