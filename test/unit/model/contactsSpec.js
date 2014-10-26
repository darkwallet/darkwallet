/**
 * @fileOverview Contacts (Address book).
 */
'use strict';

define(['model/contacts', 'util/stealth', 'model/contact'], function(Contacts, Stealth, Contact) {
  describe('Contacts model', function() {
    
    var contacts, satoshiForest, _store, satoshiForestNew, satoshiForestAddress;
    var store = {
      init: function(key, value) {
        return value;
      },
      save: function() {
        _store = [];
        for(var i = 0; i < contacts.contacts.length; i++) {
          _store[i] = contacts.contacts[i].data.name;
        }
      }
    };
    var identity = {
      store: store,
      wallet: {
        versions: {
          address: 0,
          stealth: {address: Stealth.version, prefix: "v"},
          p2sh: 5
        }
      }
    };
    
    beforeEach(function() {
      store.init = function(key, value) {
        return value;
      };
      contacts = new Contacts(store, identity);
      contacts._contacts = []; // Delete darkwallet contact
      contacts.contacts = []; // Delete darkwallet contact
      satoshiForestAddress = '1M72Sfpbz1BPpXFHz9m3CdqATR44Jvaydd';
      satoshiForestNew = {name: 'Satoshi Forest', address: satoshiForestAddress},
      satoshiForest = { name: 'Satoshi Forest', mainKey: 0, pubKeys: [{data: satoshiForestAddress, type: 'address', address: satoshiForestAddress}] };
      _store = [];
    });

    it('is created properly', function() {
      contacts = new Contacts(store, identity);
      expect(contacts.store).toBe(store);
      expect(contacts.contacts[0].data).toEqual({
          name : 'DarkWallet team',
          pubKeys : [ { data : '31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy', pubKey : undefined, type : 'address', address : '31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy' } ],
          mainKey : 0,
          hash : '97ff6614bac3eab9ee8afdf4e7ced9f790a776c77f5b8c7a1e1b74763f616cd3',
          trust: [0,0,0]
        });
      expect(contacts.contacts[1].data).toEqual({
          name : 'libbitcoin team',
          pubKeys : [ { data : '339Bsc4f6jeh4k15difzbr4TTfoeS9uEKP', pubKey : undefined, type : 'address', address : '339Bsc4f6jeh4k15difzbr4TTfoeS9uEKP' } ],
          mainKey : 0,
          hash : '627b0f3cea255982d98a3a9f2f1addda472bcb564505002a8ab7e43cd1f9bef6',
          trust: [0,0,0]
        });
    });

    // don't think we handle this case, if it happens should be cleaned up before..
    xit('is created properly with some empty contact', function() {
      store.init = function(key, value) {
          if (key == 'contacts') {
              return [null]
          } else {
              return value;
          }
      }
 
      contacts = new Contacts(store, identity);
      expect(contacts.contacts.length).toBe(1);
    });
    // it('initializes contacts'); // TODO Delete it in DarkWallet 1.0

    it('prepares an address', function() {
      var data = '04cf2e5b02d6f02340f5a9defbbf710c388b8451c82145b1419fe9696837b1cdefc569a2a79baa6da2f747c3b25a102a081dfd5e799abc41262103e0d17114770b';
      var key = contacts.parseKey(data);
      var libBitcoinPub = [4,207,46,91,2,214,240,35,64,245,169,222,251,191,113,12,56,139,132,81,200,
                           33,69,177,65,159,233,105,104,55,177,205,239,197,105,162,167,155,170,109,162,
                           247,71,195,178,90,16,42,8,29,253,94,121,154,188,65,38,33,3,224,209,113,20,119,11];
      expect(key.data).toBe(data);
      expect(key.address).toBe('1Fufjpf9RM2aQsGedhSpbSCGRHrmLMJ7yY');
      expect(key.pubKey).toEqual(libBitcoinPub);
      expect(key.type).toBe('pubkey');
      
    });

    it('prepares a stealth address', function() {
      var data = 'vJmuN2YqducEXDVX9EAu5HFNfnfDv1fCBhKmhUPTcvaykpM1mvyRXhHFVsJwWa47kGiZU14JrsxgCPsW1bd3pT8arAiTYRd9zhRPAT';
      var key = contacts.parseKey(data);
      expect(key.data).toBe(data);
      expect(key.address).toBe(data);
      expect(key.pubKey).toEqual([2,159,232,217,203,3,194,39,63,147,143,84,79,107,13,189,71,126,12,131,188,2,154,242,76,126,37,119,160,45,224,171,125]);
      expect(key.type).toBe('stealth');
      
    });
    
    it('updates contact hash', function() {
      var forest = new Contact(satoshiForest, contacts);
      forest.updateHash();
      expect(satoshiForest.hash).toBe('ca308ce5eeda89f8a7607f4a3106eb4a3a52eddf84933b03afb8e1bc0799ecf3');
    });
    
    it('generates and address hash', function() {
      var hash = contacts.generateAddressHash(satoshiForest.pubKeys[0].address);
      expect(hash).toBe('ca308ce5eeda89f8a7607f4a3106eb4a3a52eddf84933b03afb8e1bc0799ecf3');
    });
    
    it('generates a contact hash', function() {
      var data = '04cf2e5b02d6f02340f5a9defbbf710c388b8451c82145b1419fe9696837b1cdefc569a2a79baa6da2f747c3b25a102a081dfd5e799abc41262103e0d17114770b';
      expect(contacts.generateContactHash(data)).toBe("8f22baa6aeb2005c90187e52bedbf2201872bf225d247dc1c09541de2c393de0");
    });
    
    it('finds a contact by pubkey', function() {
      var libBitcoin =  {name: 'libbitcoin', address: '04cf2e5b02d6f02340f5a9defbbf710c388b8451c82145b1419fe9696837b1cdefc569a2a79baa6da2f747c3b25a102a081dfd5e799abc41262103e0d17114770b'};
      var libBitcoin2 =  {name: 'libbitcoin2', address: '04cf2e5b02d6f02340f5a9defbbf710c388b8451c82145b1419fe9696837b1cdefc569a2a79baa6da2f747c3b25a102a081dfd5e799abc41262103e0d17114770b'};
      var libBitcoinPub = [4,207,46,91,2,214,240,35,64,245,169,222,251,191,113,12,56,139,132,81,200,
                           33,69,177,65,159,233,105,104,55,177,205,239,197,105,162,167,155,170,109,162,
                           247,71,195,178,90,16,42,8,29,253,94,121,154,188,65,38,33,3,224,209,113,20,119,11];
      contacts.addContact(libBitcoin2);
      contacts.addContact(libBitcoin);
      // this is to trigger an error that should not break the search
      contacts.contacts[0].pubKeys[0].data = 'foo';
      var libBitcoinShort = [3,207,46,91,2,214,240,35,64,245,169,222,251,191,113,12,56,139,132,81,200,33,69,177,65,159,233,105,104,55,177,205,239];

      var contact = contacts.findByPubKey(libBitcoinPub);

      expect(contact.data.name).toEqual(libBitcoin.name);
      expect(contact.data.address).toEqual(libBitcoin.address);

      contact = contacts.findByPubKey(libBitcoinShort);

      expect(contact.data.name).toEqual(libBitcoin.name);
      expect(contact.data.address).toEqual(libBitcoin.address);
    });
    
    it('adds contact', function() {
      contacts.addContact(satoshiForestNew);
      expect(contacts.contacts.length).toBe(1);
      expect(satoshiForestNew.hash).toBe('ca308ce5eeda89f8a7607f4a3106eb4a3a52eddf84933b03afb8e1bc0799ecf3');
      expect(_store).toContain('Satoshi Forest');
    });
    
    it('throws updating a wrong index', function() {
      var contact = contacts.addContact(satoshiForestNew);
      contact.data.pubKeys = [];
      contact.pubKeys = contact.data.pubKeys;
      expect(function() {
         contact.updateKey(data, 3);
      }).toThrow();
    });
    
    it('updates contact', function() {
      var forest = contacts.addContact(satoshiForestNew);
      forest.data.name = "Sean's Outpost";
      forest.update('PSZVWeaa8shwLVGSCo9WZrM8zGtdJuFsBW', 0);
      expect(forest.mainKey.address).toBe('PSZVWeaa8shwLVGSCo9WZrM8zGtdJuFsBW');
      expect(forest.data.hash).toBe('c410cf311c6cda613d9b494164b304fa1dc413494dcc045477c65008361c47d8');
      expect(_store).toContain("Sean's Outpost");
      
      expect(function() {
        forest.update({name: 'Dorian', address: 'unknown'});
      }).toThrow();
    });

    it('finds a contact by address', function() {
      contacts.addContact(satoshiForestNew);
      var contact = contacts.findByAddress(satoshiForestAddress);
      expect(contact.mainKey.address).toBe(satoshiForestAddress);
      expect(contact.data.hash).toBe('ca308ce5eeda89f8a7607f4a3106eb4a3a52eddf84933b03afb8e1bc0799ecf3');
      
    });

    it('adds a contact key', function() {
      contacts.addContact(satoshiForestNew);
      var contact = contacts.findByAddress(satoshiForestAddress);
      contact.addKey('PSZVWeaa8shwLVGSCo9WZrM8zGtdJuFsBW');
      expect(contact.pubKeys.length).toBe(2);
      
    });

    it('adds a contact with no pubKeys', function() {
      contacts.addContact(satoshiForestNew);

      var contact = contacts.findByAddress(satoshiForestAddress);
      contact.pubKeys = [];
      contact.data.pubKeys = contact.pubKeys;

      contact.addKey('PSZVWeaa8shwLVGSCo9WZrM8zGtdJuFsBW');

      expect(contact.pubKeys.length).toBe(1);
    });

    it('update key with no pubkeys', function() {
      contacts.addContact(satoshiForestNew);
      var contact = contacts.findByAddress(satoshiForestAddress);

      delete contact.pubKeys;
      delete contact.data.pubKeys;

      expect(function() {
          contact.updateKey('PSZVWeaa8shwLVGSCo9WZrM8zGtdJuFsBW', 1);
      }).toThrow();
      
    });



    it('sets the main key', function() {
      contacts.addContact(satoshiForestNew);
      var contact = contacts.findByAddress(satoshiForestAddress);
      expect(contact.data.hash).toBe("ca308ce5eeda89f8a7607f4a3106eb4a3a52eddf84933b03afb8e1bc0799ecf3");
      contact.addKey('PSZVWeaa8shwLVGSCo9WZrM8zGtdJuFsBW');
      contact.addKey('31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy');
      contact.setMainKey(1);
      expect(contact.data.mainKey).toBe(1);
      expect(contact.data.hash).toBe("c410cf311c6cda613d9b494164b304fa1dc413494dcc045477c65008361c47d8");

      // key does not exist
      expect(function() {
          contact.setMainKey(7);
      }).toThrow();
    });


    it('deletes contact', function() {
      var forest = contacts.addContact(satoshiForestNew);
      contacts.deleteContact(forest);
      expect(contacts.contacts).not.toContain(forest);
      expect(_store).not.toContain('Satoshi Forest');

      // now try when it's not there any more
      expect(function() {
        contacts.deleteContact(forest);
      }).toThrow();

    });
  });

  /**
   * Model upgrade original version, just wipes out the store
   */
  xdescribe('Model upgrade 1', function() {
    var contacts;
    var store = {
      init: function(key, value) {
        if (key == 'contacts') {
            return {'foo': 'bar'};
        }
        return value;
      },
      save: function() {
      },
      set: function() {
      }
    };
    var identity = {store: store, wallet: {versions: {stealth: ''}}};
 
    beforeEach(function() {
      contacts = new Contacts(store, identity);
    });

    it('it upgrades from array properly', function() {
      expect(contacts.store).toBe(store);
      expect(contacts.contacts).toEqual([]);
    });

  });

  /**
   * Model upgrade from single address to array of address/keys.
   */
  describe('Model upgrade 2', function() {
    var contacts;
    var satoshiForest = {name: 'Satoshi Forest', address: '1M72Sfpbz1BPpXFHz9m3CdqATR44Jvaydd'};
    var satoshiForestNew = {
      name: 'Satoshi Forest',
      mainKey: 0,
      hash : 'ca308ce5eeda89f8a7607f4a3106eb4a3a52eddf84933b03afb8e1bc0799ecf3',
      pubKeys: [
        {data: '1M72Sfpbz1BPpXFHz9m3CdqATR44Jvaydd', type: 'address', pubKey: undefined, address: '1M72Sfpbz1BPpXFHz9m3CdqATR44Jvaydd'}
      ],
      trust : [ 0, 0, 0 ]
    };
    var store = {
      init: function(key, value) {
        if (key == 'contacts') {
            return [satoshiForest];
        }
        return value;
      },
      save: function() {
      },
      set: function() {
      }
    };
    var identity = {
      store: store,
      wallet: {
        versions: {
          address: 0,
          stealth: {address: Stealth.version},
          p2sh: 5
        }
      }
    };
 
    beforeEach(function() {
      contacts = new Contacts(store, identity);
    });

    it('it upgrades from array properly', function() {
      expect(contacts.store).toBe(store);
      expect(contacts.contacts[0].data).toEqual(satoshiForestNew);
    });

  });


});
