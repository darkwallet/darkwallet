/*
 * @fileOverview Main object for generic dark wallet api.
 */

define(function() {
// DarkWallet object.
var DarkWallet = {

    // Get the wallet service.
    service: function() {return chrome.extension.getBackgroundPage();},

    // Identity key ring. Holds all identities.
    getKeyRing: function() {return DarkWallet.service().getKeyRing()},

    // Light client
    getClient: function() {return DarkWallet.service().getClient()},

    // Get identity
    getIdentity: function(idx) {return DarkWallet.service().getIdentity(idx)},

    // Lobby transport
    getLobbyTransport: function() {return DarkWallet.service().getLobbyTransport()}
};
return DarkWallet;
});
