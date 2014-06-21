/**
 * @fileOverview ContactsCtrl angular controller
 */
'use strict';

define(['angular-mocks', 'testUtils'], function (mocks, testUtils) {

  describe('Contacts controller', function() {
    var contactsController, scope, routeParams, location, _contacts, DarkWallet;

    var identity = {
      contacts: {
        contacts: _contacts,
        addContact: function(newContact) {
          identity.contacts.contacts.push(newContact);
          return newContact;
        },
        updateContact: function(contact) {},
        deleteContact: function(contact) {}
      },
      wallet: {
        pockets: {
            pockets: {readonly: [], hd: [], multisig: []},
            getPockets: function() {return []}
        }
      }
    };
    
    var resetContacts = function() {
      identity.contacts.contacts = [
        {data: { name: "Satoshi Nakamoto", mainKey: 0, pubKeys: [{address: "address1", data: "address1", type: "address"}]}},
        {data: { name: "Dorian Nakamoto", mainKey: 0, pubKeys: [{address: "address2", data: "address2", type: "address"}]}},
        {data: { name: "Satoshi Forest", mainKey: 0, pubKeys: [{address: "address3", data: "address3", type: "address"}]}}
      ];
      for(var i=0; i<3; i++) {
          identity.contacts.contacts[i].pubKeys = identity.contacts.contacts[i].data.pubKeys;
          identity.contacts.contacts[i].remove = function() {};
          identity.contacts.contacts[i].update = function() {};
          spyOn(identity.contacts.contacts[i], 'remove');
          spyOn(identity.contacts.contacts[i], 'update');
      }
      _contacts = identity.contacts.contacts;
    };
    
    var injectController = function(routeParams) {
      mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
        var watch = {};
        watch.removePocket = function() {};
        watch.initPocket = function() {};
        watch.renamePocket = function() {};
        watch.addKey = function() {};
        watch.removeKey = function() {};
        watch.renameKey = function() {};
        scope = $rootScope.$new();
        routeParams = routeParams || {};
        location = {
          path: function(path) {
            location._path = path;
          }
        };
        var history = {refreshAddresses: function() {}};
        var route = {contactId: undefined, current: {templateUrl: "bla"}};
        var wallet = {addToScope: function() {}};
        contactsController = $controller('ContactsCtrl', {$scope: scope, $routeParams: routeParams, $location: location, $route: route, $wallet: wallet, watch: watch, $history: history});
      }]);
    };
    
    beforeEach(function(done) {
      testUtils.stub('darkwallet', {
        getIdentity: function() {
          return identity;
        }
      });
      
      mocks.module("DarkWallet.controllers");
      
      testUtils.loadWithCurrentStubs('frontend/controllers/contacts', function() {
        resetContacts();
        injectController();
        DarkWallet = require('darkwallet');
        spyOn(identity.contacts, 'deleteContact');
        done();
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    });

    describe('', function() {

      it('is created properly', function() {
        expect(scope.newContact).toEqual({});
        expect(scope.contactToEdit).toEqual({});
        expect(scope.contactFormShown).toBe(false);
        expect(scope.contacts).toEqual(DarkWallet.getIdentity().contacts.contacts);
        expect(scope.allContacts).toEqual(DarkWallet.getIdentity().contacts.contacts);
        expect(scope.contactSearch).toBe('');
      });

      it('filters contacts', function() {
        scope.contactSearch = 'Nakamoto';
        scope.filterContacts();
        expect(scope.contacts.length).toEqual(2);
        scope.contactSearch = 'Satoshi Nakamoto';
        scope.filterContacts();
        expect(scope.contacts.length).toEqual(1);
      });

      it('creates a new contact', function() {
        var newContact = {name: 'DarkWallet donations', address: '31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy'};
        scope.newContact = newContact;
        scope.createContact();
        expect(scope.contacts.length).toBe(4);
        expect(scope.contacts).toContain(newContact);
        expect(scope.newContact).toEqual({});
        expect(scope.contactFormShown).toBe(false);
      });

      it('opens the edit form', function() {
        scope.openEditForm(_contacts[0], 0);
        expect(scope.contactToEdit).toEqual({name: _contacts[0].data.name, address: _contacts[0].pubKeys[0].data, type: undefined});
      });

      it('opens a contact', function() {
        scope.openContact(_contacts[2]);
        expect(location._path).toBe('/contact/2');
      });

      it('edits a contact', function() {
        scope.contactToEdit = {name: 'Nakamoto Satoshi', address: '6...'};
        scope.editContactKey(_contacts[0], 0);
        expect(_contacts[0].update).toHaveBeenCalledWith('6...', 0);
      });

      it('deletes a contact', function() {
        expect(_contacts[0].data.name).toEqual('Satoshi Nakamoto');
        expect(scope.contacts[0].data.name).toEqual('Satoshi Nakamoto');

        scope.deleteContact(_contacts[0]);

        expect(_contacts[0].remove).toHaveBeenCalled();
        expect(scope.contacts[0].data.name).not.toEqual('Satoshi Nakamoto');
        expect(scope.contacts.length).toBe(2);
        expect(location._path).toBe('/contacts');
        
        // Deleting unexisting contact throws.
        expect(function() {scope.deleteContact({})}).toThrow();
        expect(scope.contacts.length).toBe(2);
      });
    });

    describe('initiated with route param', function() {
      it('redirects to a contact', function() {
        injectController({contactId: 2});
        expect(scope.vars.contact).toBe(_contacts[2]);
      });
    });
    
    describe('initiated with incorrect route param', function() {
      it('redirects to a contact', function() {
        injectController({contactId: -1});
        expect(location._path).toBe('/contacts');
      });
    });
  });
});
