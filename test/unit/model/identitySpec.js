/**
 * @fileOverview Identity properties and data.
 */
'use strict';

define(['model/identity'], function(Identity) {
  describe('Identity model', function() {
    
    var identity, store, _store, _password;
    
    beforeEach(function() {
      _store = { name: "Sean\'s Outpost" };
      store = {
        init: function(key, value) {
          return value;
        },
        get: function(key) {
          return _store[key];
        },
        getPrivateData: function(password) {
          if (_password && password != _password) {
            throw new Error("ccm: tag doesn't match");
          }
          return _store['private'];
        },
        setPrivateData: function(data, newPassword) {
          _password = newPassword;
          _store['private'] = data;
        },
        set: function(key, value) {
          _store[key] = value;
        },
        save: function() {
        }
      };
      identity = new Identity(store, 'deba0a36765d68e54ba70f38ca9b63fb', 'p4ssw0rd');
    });

    it('is created properly', function() {
      expect(identity.name).toBe("Sean's Outpost");
      expect(identity.settings).toEqual({currency: 'BTC', fiatCurrency: 'EUR', notifications: {popup: true, send: true, receive: true, multisig: true}});
      expect(identity.store).toBeDefined();
      expect(identity.wallet).toBeDefined();
      expect(identity.txdb).toBeDefined();
      expect(identity.history).toBeDefined();
      expect(identity.contacts).toBeDefined();
      expect(identity.connections).toBeDefined();
      expect(identity.tasks).toBeDefined();
    });

    it('changes password', function() {
      expect(identity.changePassword('p4ssw0rd', 'd0n0th4ckm3')).toBeTruthy();
      expect(_password).toBe('d0n0th4ckm3');
      expect(identity.changePassword('1nc0rr3ct', 'p4ssw0rd')).toBeFalsy();
    });
    
    it('generates', function() { // private
      identity.generate('deba0a36765d68e54ba70f38ca9b63fb', 'p4ssw0rd');
      expect(_store.scankeys[0].pub).toBe('xpub6BShZfzXJHmns5ySVJRbtfSUQ7F1yoW5JhSSieXk5TbUatLYvs6LzUPr7ucwmsAdkZpDENh8snvS6pMRAxGikQzCfiakdmHxH97wdcmRzdM');
      expect(_store.scankeys[0].priv).toBe('xprv9xTMAATdTvDVebtyPGtbXXVjr5QXaLnDwUWqvG88X84Vi61QPKn6Sg5NGe8bpTHcrXyERVQeYiVA8AkM4Xu28YcrvbSwXEt5kyGJQGgAdKX');
      expect(_store.idkeys[0].pub).toBe('xpub6BShZfzXJHmnv68RPbTKT1nCsCPtE2iBC6j3qCpfMYuy1KnnHJAhxqoCsPP2FVosrQJ4FEZPxSDdgR4vEDtwCULdwEANYwq7uDLqzK6UNuh');
      expect(_store.idkeys[0].priv).toBe('xprv9xTMAATdTvDVhc3xHZvK5sqUKAZPpZzKpsoT2pR3oDNz8XTdjkrTR3Uj26Rpy4CM46DDNb5Ae5Uf8ei1usbjK2qToDUFx97g8M2XduB7Cbe');
      expect(_store.mpk).toBe('xpub67xpMzHwYtH8zxnfFWMRNuHd43bJYtjBjtTfWeubZq16h75DrnUtCZchBmwLZUTKvcYiyGL5LW6MiwjnLAx3kwpAkytrjSCyqvTtJMX8GNW');
      expect(_store.version).toBe(1);
      expect(_store.pubkeys).toEqual({});
      expect(_store.contacts).toEqual({});
      expect(_store.transactions).toEqual({});
    });
  });
});
