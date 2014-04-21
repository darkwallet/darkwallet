/**
 * @fileOverview Contacts (Address book).
 */
'use strict';

define(['model/contacts'], function(Contacts) {
  describe('Contacts model', function() {
    
    var contacts, satoshiForest, _store, satoshiForestNew;
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
      satoshiForestNew = {name: 'Satoshi Forest', address: '1M72Sfpbz1BPpXFHz9m3CdqATR44Jvaydd'},
      satoshiForest = {name: 'Satoshi Forest', mainKey: 0, pubKeys: [{data: '1M72Sfpbz1BPpXFHz9m3CdqATR44Jvaydd', type: 'address', address: '1M72Sfpbz1BPpXFHz9m3CdqATR44Jvaydd'}]};
      _store = [];
    });

    it('is created properly', function() {
      expect(contacts.store).toBe(store);
      expect(contacts.contacts).toEqual([]);
    });

    it('adds contact', function() {
      contacts.addContact(satoshiForestNew);
      expect(contacts.contacts.length).toBe(1);
      expect(satoshiForestNew.hash).toBe('ca308ce5eeda89f8a7607f4a3106eb4a3a52eddf84933b03afb8e1bc0799ecf3');
      expect(_store).toContain('Satoshi Forest');
    });

     it('finds a contact', function() {
      var libBitcoin =  {name: 'libbitcoin', address: '04cf2e5b02d6f02340f5a9defbbf710c388b8451c82145b1419fe9696837b1cdefc569a2a79baa6da2f747c3b25a102a081dfd5e799abc41262103e0d17114770b'};
      var libBitcoinPub = [4,207,46,91,2,214,240,35,64,245,169,222,251,191,113,12,56,139,132,81,200,
                           33,69,177,65,159,233,105,104,55,177,205,239,197,105,162,167,155,170,109,162,
                           247,71,195,178,90,16,42,8,29,253,94,121,154,188,65,38,33,3,224,209,113,20,119,11];
      contacts.addContact(libBitcoin);
      var libBitcoinShort = [3,207,46,91,2,214,240,35,64,245,169,222,251,191,113,12,56,139,132,81,200,33,69,177,65,159,233,105,104,55,177,205,239];

      var contact = contacts.findByPubKey(libBitcoinPub);

      expect(contact.name).toEqual(libBitcoin.name)
      expect(contact.address).toEqual(libBitcoin.address)

      contact = contacts.findByPubKey(libBitcoinShort);

      expect(contact.name).toEqual(libBitcoin.name)
      expect(contact.address).toEqual(libBitcoin.address)
    });
    
    // it('initializes contacts'); // TODO Delete it in DarkWallet 1.0

    it('updates contact hash', function() {
      contacts.updateContactHash(satoshiForest);
      expect(satoshiForest.hash).toBe('ca308ce5eeda89f8a7607f4a3106eb4a3a52eddf84933b03afb8e1bc0799ecf3');
    });

    it('prepares an address', function() {
      var data = '04cf2e5b02d6f02340f5a9defbbf710c388b8451c82145b1419fe9696837b1cdefc569a2a79baa6da2f747c3b25a102a081dfd5e799abc41262103e0d17114770b';
      var key = contacts.prepareAddress(data);
      expect(key.data).toBe(data);
      expect(key.address).toBe('1C1vwLbunGupvKUMhgrhkFnUTZcGe8wpH2');
      expect(key.pubKey).toEqual([3,207,46,91,2,214,240,35,64,245,169,222,251,191,113,12,56,139,132,81,200,33,69,177,65,159,233,105,104,55,177,205,239]);
      expect(key.type).toBe('pubkey');
      
    });

    it('prepares a stealth address', function() {
      var data = '6aeUL6NvtpdchLf3UWkWsyqQZR4mwCAephsUrp5nhLDAN2kRcUMVgjdettWEd5DgXWM6tUBHe5vpMfS5L5iu3ChxK3uthRceSobvxYa';
      var key = contacts.prepareAddress(data);
      expect(key.data).toBe(data);
      expect(key.address).toBe(data);
      expect(key.pubKey).toEqual([3,6,43,123,39,102,203,84,146,220,178,28,26,66,64,231,94,38,228,218,231,209,238,160,62,154,123,54,79,90,109,5,168]);
      expect(key.type).toBe('stealth');
      
    });


    it('updates contact', function() {
      contacts.addContact(satoshiForestNew);
      var forest = contacts.contacts[0];
      forest.name = "Sean's Outpost";
      contacts.updateContact(forest, 'PSZVWeaa8shwLVGSCo9WZrM8zGtdJuFsBW', 0);
      expect(forest.pubKeys[forest.mainKey].address).toBe('PSZVWeaa8shwLVGSCo9WZrM8zGtdJuFsBW');
      expect(forest.hash).toBe('c410cf311c6cda613d9b494164b304fa1dc413494dcc045477c65008361c47d8');
      expect(_store).toContain("Sean's Outpost");
      
      expect(function() {
        contacts.updateContact({name: 'Dorian', address: 'unknown'});
      }).toThrow();
    });

    it('deletes contact', function() {
      contacts.addContact(satoshiForestNew);
      var forest = contacts.contacts[0];
      contacts.deleteContact(forest);
      expect(contacts.contacts).not.toContain(forest);
      expect(_store).not.toContain('Satoshi Forest');

      // now try when it's not there any more
      expect(function() {
        contacts.deleteContact(satoshiForest);
      }).toThrow();

    });
  });
});
