/*
 * @fileOverview Manage and serialize identities.
 */

define(['model/keyring', 'util/mock/chrome_mock'], function(IdentityKeyRing, chrome) {
  // DarkWallet namespace for the local storage.
  var DW_NS = 'dw:identity:';

  describe('Identity keyring model', function() {
    
    var keyring;
    
    beforeEach(function() {
      chrome.storage.local.clear();
      var pars = {};
      pars[DW_NS + 'Satoshi'] = {name: 'Satoshi'};
      pars[DW_NS + 'Dorian'] = {name: 'Dorian'};
      chrome.storage.local.set(pars, function(){
        keyring = new IdentityKeyRing();
      });
    });

    it('is created properly', function() {
      expect(keyring.identities).toEqual({});
      expect(keyring.availableIdentities).toEqual(['Satoshi', 'Dorian']);
    });

    it('gets an idenity', function() {
      keyring.get('Satoshi', function(identity) {
        expect(identity.name).toBe('Satoshi');
      });
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
