/*
 * @fileOverview Main object for generic dark wallet api.
 */

// DarkWallet object.
var DarkWallet = {};

// Identity key ring. Holds all identities.
DarkWallet.keyRing = new IdentityKeyRing();
