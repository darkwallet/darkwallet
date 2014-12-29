'use strict';

define(['backend/channels/peer'], function (Peer) {

  var pubKey = [1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8];

  describe('Protocol format', function() {
    it('creates a peer with no pubkey', function() {
        var peer = new Peer(null, "blablabla");

        expect(peer.fingerprint).toBe("blablabla");
        expect(peer.trusted).toBeUndefined();
        expect(peer.name).toBe("door wet image door");
    });

    it('creates a peer with pubkey', function() {
        var peer = new Peer(pubKey, "blablabla");

        expect(peer.fingerprint).toBe("D8824D14A42BB927DC078415AC677EC828169112");
        expect(peer.pubKey).toEqual(pubKey);
        expect(peer.pubKeyHex).toBe("01020304050607080102030405060708");
        expect(peer.trusted).toBe(true);
        expect(peer.trusted).toBe(true);
    });

    it('gets the right mnemoname', function() {
        var peer = new Peer(pubKey);
        expect(peer.name).toBe("focus remember true focus")
    });

    it('updates a pubkey', function() {
        var peer = new Peer(null, "D8824D14A42BB927DC078415AC677EC828169112");
        expect(peer.name).toBe("door wet image door");
        peer.updateKey(pubKey);
        expect(peer.name).toBe("focus remember true focus")
    });

    it('updates with no pubkey', function() {
        var peer = new Peer(null, "D8824D14A42BB927DC078415AC677EC828169112");
        expect(function() {
            peer.updateKey(null);
        }).toThrow();
    });

    it('updates with invalid fingerprint', function() {
        var peer = new Peer(null, "A8824D14A42BB927DC078415AC677EC828169111");
        expect(function() {
            peer.updateKey(pubKey);
        }).toThrow();
    });


  });
 
});
