/**
 * @fileOverview Contacts (Address book).
 */
'use strict';

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

     it('finds a contact', function() {
      var libBitcoin =  {name: 'libbitcoin', address: '04cf2e5b02d6f02340f5a9defbbf710c388b8451c82145b1419fe9696837b1cdefc569a2a79baa6da2f747c3b25a102a081dfd5e799abc41262103e0d17114770b'};
      var libBitcoinPub = [4,207,46,91,2,214,240,35,64,245,169,222,251,191,113,12,56,139,132,81,200,
                           33,69,177,65,159,233,105,104,55,177,205,239,197,105,162,167,155,170,109,162,
                           247,71,195,178,90,16,42,8,29,253,94,121,154,188,65,38,33,3,224,209,113,20,119,11];
      contacts.addContact(libBitcoin);

      var contact = contacts.findByPubKey(libBitcoinPub);

      expect(contact.name).toEqual(libBitcoin.name)
      expect(contact.address).toEqual(libBitcoin.address)
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

      // now try when it's not there any more
      expect(function() {
        contacts.deleteContact(satoshiForest);
      }).toThrow();

    });
  });
});
