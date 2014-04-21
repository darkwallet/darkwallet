/*
 * @fileOverview Manage and serialize identities.
 */
'use strict';

define(['testUtils'], function(testUtils) {
  // DarkWallet namespace for the local storage.
  var DW_NS = 'dw:identity:';

  describe('Identity keyring model', function() {
    
    var keyring, chrome, IdentityKeyRing;
    
    beforeEach(function(done) {
      
      var chrome_storage = {};
      //testUtils.stub('chrome', {
      chrome = {
        storage: {
          local: {
            get: function(key, callback) {
              var obj = {};
              if (key === null) {
                obj = chrome_storage;
              } else {
                obj[key] = (typeof chrome_storage[key] != 'undefined') ? chrome_storage[key] : {};
              }
              callback? callback(obj) : null;
            },
            set: function(pairs, callback) {
              for(var key in pairs) {
                chrome_storage[key] = pairs[key];
              }
              callback? callback() : null;
            },
            clear: function() {
              chrome_storage = {};
            },
            _: function() {
              return chrome_storage;
            }
          }
        }
      //});
      };
      window.chrome = chrome;
      
      testUtils.stub('model/identity', function(store) {
        this.name = store.store.name;
        this.store = store;
      });
      
      testUtils.stub('model/store', function(data, keyring) {
        this.store = data;
        this.keyring = keyring;
      });
      
      testUtils.loadWithCurrentStubs('model/keyring', function(_IdentityKeyRing) {
        //chrome = require('chrome');
        IdentityKeyRing = _IdentityKeyRing;
        chrome.storage.local.clear();
        var pars = {};
        pars[DW_NS + 'Satoshi'] = {name: 'Satoshi'};
        pars[DW_NS + 'Dorian'] = {name: 'Dorian'};
        chrome.storage.local.set(pars, function() {
          keyring = new IdentityKeyRing();
          done();
        });
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    });

    it('is created properly', function() {
      expect(keyring.identities).toEqual({});
      expect(keyring.availableIdentities).toEqual(['Satoshi', 'Dorian']);
    });

    it('gets an idenity', function() {
      keyring.get('Satoshi', function(identity) {
        expect(identity.name).toBe('Satoshi');
      });
      
      // Cached
      keyring.get('Satoshi', function(identity) {
        expect(identity.name).toBe('Satoshi');
      });
      expect(function() {
        keyring.get('Amir');
      }).toThrow();
    });

    it('gets identity names', function() {
      expect(keyring.getIdentityNames()).toEqual(['Satoshi', 'Dorian']);
    });

    it('closes', function() {
      keyring.load('Satoshi');
      expect(keyring.identities.Satoshi).toBeDefined();
      keyring.close('Satoshi');
      expect(keyring.identities).toEqual({});
    });

    it('creates an identity', function() {
      keyring.createIdentity('Max', 'seed', 'p4ssw0rd');
      expect(keyring.identities.Max).toBeDefined();
      expect(keyring.availableIdentities).toContain('Max');
      expect(keyring.availableIdentities.length).toBe(3);
      
      // Override identity
      keyring.createIdentity('Satoshi', 'seed', 'p4ssw0rd');
      expect(keyring.identities.Satoshi).toBeDefined();
      expect(keyring.availableIdentities).toContain('Satoshi');
      expect(keyring.availableIdentities.length).toBe(3);
      
    });

    describe('loads identities', function() {
      it('that are not cached', function() {
        keyring.availableIdentities = [];
        keyring.loadIdentities(function(identities) {
          expect(identities).toEqual(['Satoshi', 'Dorian']);
        });
        
        keyring.availableIdentities = [];
        var pars = {};
        pars[DW_NS + 'Satoshi'] = {name: 'Satoshi'};
        pars[DW_NS + 'Dorian'] = {name: 'Dorian'};
        pars['Somethingelse'] = {};
        chrome.storage.local.set(pars, function() {
          keyring.loadIdentities(function(identities) {
            expect(identities).toEqual([ 'Satoshi', 'Dorian' ]);
          });
        });
      });
      it('that are cached', function() {
        keyring.loadIdentities(function() {
          expect(keyring.availableIdentities).toEqual(['Satoshi', 'Dorian']);
          chrome.storage.local.clear();
          keyring = new IdentityKeyRing();
          expect(keyring.identities).toEqual({});
          expect(keyring.availableIdentities).toEqual([]);
        });
      });
      it('and do not throw if there is no callback', function() {
        keyring.loadIdentities();
        keyring.availableIdentities = [];
        keyring.loadIdentities();
      });
    });
    
    it('loads', function() { // private
      keyring.load('Satoshi', function(identity) {
        expect(identity.name).toBe('Satoshi');
      });
    });
    
    it('saves', function() { // private
      var data = {};
      keyring.save('Satoshi', data, function() {
        expect(chrome.storage.local._()['dw:identity:Satoshi']).toBe(data);
      });
    });
    
    it('clears', function() {
      keyring.clear();
      expect(chrome.storage.local._()).toEqual({});
    });
  });
});
