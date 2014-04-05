/**
 * @fileOverview Contacts (Address book).
 */

define(['model/contacts'], function(Contacts) {
  describe('Contacts model', function() {
    
    var contacts, satoshiForest, _store;
    var store = {
      init: function(key, value) {
        return value;
      },
      save: function() {
        _store = [];
        for(var i = 0; i < contacts.contacts.length; i++) {
          _store[i] = contacts.contacts[i].name;
        }
      }
    };
    
    beforeEach(function() {
      contacts = new Contacts(store);
      satoshiForest = {name: 'Satoshi Forest', address: '1M72Sfpbz1BPpXFHz9m3CdqATR44Jvaydd'};
      _store = [];
    });

    it('is created properly', function() {
      expect(contacts.store).toBe(store);
      expect(contacts.contacts).toEqual([]);
    });

    it('adds contact', function() {
      contacts.addContact(satoshiForest);
      expect(contacts.contacts).toContain(satoshiForest);
      expect(satoshiForest.hash).toBe('ca308ce5eeda89f8a7607f4a3106eb4a3a52eddf84933b03afb8e1bc0799ecf3');
      expect(_store).toContain('Satoshi Forest');
    });
    
    // it('initializes contacts'); // TODO Delete it in DarkWallet 1.0

    it('updates contact hash', function() {
      contacts.updateContactHash(satoshiForest);
      expect(satoshiForest.hash).toBe('ca308ce5eeda89f8a7607f4a3106eb4a3a52eddf84933b03afb8e1bc0799ecf3');
    });
    
    it('updates contact', function() {
      contacts.addContact(satoshiForest);
      satoshiForest.name = "Sean's Outpost";
      satoshiForest.address = 'PSZVWeaa8shwLVGSCo9WZrM8zGtdJuFsBW';
      contacts.updateContact(satoshiForest);
      expect(contacts.contacts).toContain(satoshiForest);
      expect(_store).toContain("Sean's Outpost");
      
      expect(function() {
        contacts.updateContact({name: 'Dorian', address: 'unknown'});
      }).toThrow();
    });

    it('deletes contact', function() {
      contacts.addContact(satoshiForest);
      contacts.deleteContact(satoshiForest);
      expect(contacts.contacts).not.toContain(satoshiForest);
      expect(_store).not.toContain('Satoshi Forest');
    });
  });
});
