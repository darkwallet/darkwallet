/*
 * @fileOverview Main object for generic dark wallet api.
 */

define(function() {
// DarkWallet object.
var DarkWallet = {

    /**
     * Get the wallet service.
     * 
     * @returns {Object}
     */
    core: function() {return chrome.extension.getBackgroundPage();},

    /**
     * Get a service from the background script.
     * 
     * @param {String} name The name of the service. It can be lobby, obelisk,
     * wallet, gui, ticker, mixer, notifier or ctxMenus.
     * @returns {Object}
     */
    getService: function(name) {return DarkWallet.core().getService(name);},

    /**
     * Identity key ring. Holds all identities.
     * 
     * @returns {Object}
     */
    getKeyRing: function() {return DarkWallet.core().getKeyRing();},

    /**
     * Light client
     * 
     * @returns {Object}
     */
    getClient: function() {return DarkWallet.core().getClient();},

    /**
     * Get identtiy
     * 
     * @param {Number} [idx] Index of the identity, default is current.
     * @returns {Object}
     */
    getIdentity: function(idx) {return DarkWallet.core().getIdentity(idx);},

    /**
     * Lobby transport
     * 
     * @returns {Object}
     */
    getLobbyTransport: function() {return DarkWallet.core().getLobbyTransport();}
};
return DarkWallet;
});
