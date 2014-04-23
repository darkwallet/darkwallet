/*
 * @fileOverview Identity connections to servers.
 */
'use strict';

define(['model/connections'], function(Connections) {
  describe('Connections model', function() {

    var connections;
    var identity = {
      store: {
        init: function(key, value) {
          return value;
        },
        save: function() {},
        get: function() {
          return 'bitcoin';
        }
      }
    };
    
    beforeEach(function() {
      connections = new Connections(identity.store, identity);
    });

    it('is created properly', function() {
      expect(connections.store).toBe(identity.store);
      expect(connections.connections.servers).toBeDefined();
      expect(connections.connections.selectedServer).toBe(0);
      expect(connections.connections.alwaysConnect).toBe(0);
      expect(connections.servers).toBe(connections.connections.servers);
      expect(connections.selectedServer).toBe(0);
      expect(connections.alwaysConnect).toBe(0);
    });

    it('adds a server', function() {
      connections.addServer('foo', 'bar', 'baz');
      expect(connections.servers[1]).toEqual({ name : 'foo', type : 'baz', address : 'bar' });
      connections.addServer('qux', 'bar');
      expect(connections.servers[2]).toEqual({ name : 'qux', type : 'gateway', address : 'bar' });
    });

    it('sets selected server', function() {
      connections.setSelectedServer(1);
      expect(connections.selectedServer).toBe(1);
    });

    it('sets always connect setting', function() {
      connections.setAlwaysConnect(1);
      expect(connections.alwaysConnect).toBe(1);
    });
  });
});
