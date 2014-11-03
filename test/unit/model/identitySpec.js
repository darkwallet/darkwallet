/**
 * @fileOverview Identity properties and data.
 */
'use strict';

define(['model/identity', 'util/fiat'], function(Identity, FiatCurrency) {
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
      expect(identity.settings).toEqual({
        currency: 'BTC',
        fiatCurrency: FiatCurrency.getDefault(),
        animations: {
          enabled: true
        },
        notifications: {
          popup: false,
          send: true,
          receive: true,
          multisig: true
        },
        language: 'en_US'
      });
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
      expect(_store.scankeys[0].pub).toBe('xpub6CAanHj7Ah74red5SJ2zHL9weWnLcmXH4d9cC8qdmaoLzBBy1Y1d2CV495xGRxE2eAhxdCsPPNmeeEJh9nq4U18qMQWyv3hegY5AQRK74LJ');
      expect(_store.scankeys[0].priv).toBe('xprv9yBENnCDLKYmeAYcLGVyvCDD6UwrDJoRhQE1PkS2DFGN7NrpTzhNUQAaHo5DBYZur3iQCxPTWzU97kuG5YbFJZKbr9jTE2C9xwSrpWt5rJ3');
      expect(_store.idkeys[0].pub).toBe('xpub6CAanHj7Ah74vRc9KGJ5dbBMpMW6t5WewAKnqc2kmwYXGXrCrDZ7mQVecW9FcJLrnE4qMitdPNp1vfGkAXFMajhNKWHzteoV5aFqyLgPWR6');
      expect(_store.idkeys[0].priv).toBe('xprv9yBENnCDLKYmhwXgDEm5GTEdGKfcUcnoZwQC3Dd9Dc1YPjX4JgEsDcBAmD82GoVTwoYZjVY6NdeUM9Aqpof83AgHBXUckSTMZYE3dz1XmrF');
      expect(_store.mpk).toBe('xpub6BBXLyFMfg5GJBijJzLm8RsX8bDTbUSEh9Zd5iPdssA1qN8vYTjwZyPPZV3Hrip7wrHxmnuk94ThHcaUuFLzyeE9rGZ9u1UN84qiEhrFtCA');

      /* v4
      expect(_store.scankeys[0].pub).toBe('xpub6BShZfzXJHmns5ySVJRbtfSUQ7F1yoW5JhSSieXk5TbUatLYvs6LzUPr7ucwmsAdkZpDENh8snvS6pMRAxGikQzCfiakdmHxH97wdcmRzdM');
      expect(_store.scankeys[0].priv).toBe('xprv9xTMAATdTvDVebtyPGtbXXVjr5QXaLnDwUWqvG88X84Vi61QPKn6Sg5NGe8bpTHcrXyERVQeYiVA8AkM4Xu28YcrvbSwXEt5kyGJQGgAdKX');
      expect(_store.idkeys[0].pub).toBe('xpub6BShZfzXJHmnv68RPbTKT1nCsCPtE2iBC6j3qCpfMYuy1KnnHJAhxqoCsPP2FVosrQJ4FEZPxSDdgR4vEDtwCULdwEANYwq7uDLqzK6UNuh');
      expect(_store.idkeys[0].priv).toBe('xprv9xTMAATdTvDVhc3xHZvK5sqUKAZPpZzKpsoT2pR3oDNz8XTdjkrTR3Uj26Rpy4CM46DDNb5Ae5Uf8ei1usbjK2qToDUFx97g8M2XduB7Cbe');
      expect(_store.mpk).toBe('xpub67xpMzHwYtH8zxnfFWMRNuHd43bJYtjBjtTfWeubZq16h75DrnUtCZchBmwLZUTKvcYiyGL5LW6MiwjnLAx3kwpAkytrjSCyqvTtJMX8GNW');*/
      expect(_store.pubkeys).toEqual({});
    });
  });
});
