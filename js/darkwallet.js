/*
 * @fileOverview Main object for generic dark wallet api.
 */

// DarkWallet object.
var DarkWallet = {

    // Get the wallet service.
    service: function() {return chrome.extension.getBackgroundPage();},

    // Identity key ring. Holds all identities.
    getKeyRing: function() {return DarkWallet.service().getKeyRing()},

    // Light client
    getClient: function() {return DarkWallet.service().getClient()}
};

