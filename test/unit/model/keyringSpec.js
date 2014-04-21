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
              var value;
              if (key === null) {
                value = chrome_storage;
              } else {
                value = (typeof chrome_storage[key] != 'undefined') ? chrome_storage[key] : {};
              }
              callback? callback(value) : null;
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

    xit('gets an idenity', function() {
      keyring.get('Satoshi', function(identity) {
        expect(identity.name).toBe('Satoshi');
      });
    });

    it('gets identity names', function() {
      expect(keyring.getIdentityNames()).toEqual(['Satoshi', 'Dorian']);
    });

    xit('closes', function() {
      keyring.load('Satoshi');
      expect(keyring.identities.Satoshi).toBeDefined();
      keyring.close('Satoshi');
      expect(keyring.identities).toEqual({});
    });

    it('creates an identity', function() {
      keyring.createIdentity('Max', 'seed', 'p4ssw0rd');
      expect(keyring.identities.Max).toBeDefined();
      expect(keyring.availableIdentities).toContain('Max');
    });

    it('loads identities', function() {
      keyring.loadIdentities(function() {
        expect(keyring.availableIdentities).toEqual(['Satoshi', 'Dorian']);
        chrome.storage.local.clear();
        keyring = new IdentityKeyRing();
        expect(keyring.identities).toEqual({});
        expect(keyring.availableIdentities).toEqual([]);
      })
    });
    
    xit('loads', function() { // private
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
