/*
 * @fileOverview Stealth support.
 */

define(['util/stealth'], function(Stealth) {
  describe('Stealth library', function() {
    it('imports a public component');
    
    it('performs curvedh and stealth formatting');
    
    it('formats a stealth address in base58');
    
    it('parses a stealth address into its forming parts');
    
    it('generates a key and related address to send to for a stealth address');
    
    it('generates an address for receiving for a spend key with the given ephemkey');
    
    it('generates a key for receiving for a stealth key with a given ephemkey');
    
    it('generates a key for receiving for a stealth address with a given ephemkey');
    
    it('builds the stealth nonce output');
    
    it('generates bit mask for a given prefix');
    
    it('checks prefix against the given array');
    
    it('adds stealth output to the given transaction and return destination address');
  });
});