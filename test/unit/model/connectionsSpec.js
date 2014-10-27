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

    it('sets the selected server', function() {
      var sel = connections.getSelectedServer(1);
      expect(sel).toEqual({ name : 'unsystem', type : 'gateway', address : 'wss://gateway.unsystem.net' });
    });

    it('cant remove the selected server', function() {
      expect(connections.connections.servers.length).toBe(1);
      connections.removeServer(connections.servers[0]);
      expect(connections.connections.servers.length).toBe(1);
    });

    it('removes a server', function() {
      connections.addServer('foo', 'bar', 'baz');
      expect(connections.connections.servers.length).toBe(2);
      connections.removeServer(connections.servers[1]);
      expect(connections.connections.servers.length).toBe(1);
      expect(connections.connections.selectedServer).toBe(0);
    });

    it('removes a server', function() {
      connections.addServer('foo', 'bar', 'baz');
      connections.setSelectedServer(1);
      expect(connections.connections.servers.length).toBe(2);

      connections.removeServer(connections.servers[0]);
      expect(connections.connections.servers.length).toBe(1);
      expect(connections.connections.selectedServer).toBe(0);
    });

    it('sets always connect setting', function() {
      connections.setAlwaysConnect(1);
      expect(connections.alwaysConnect).toBe(1);
    });
  });
});
