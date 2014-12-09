/*
 * @fileOverview Main object for generic dark wallet api.
 */
'use strict';

define(function() {
// DarkWallet object.
var DarkWallet = {

    /**
     * Internal api version. Gets saved by the backend as servicesStatus.apiVersion,
     * so frontend code can see if the backend needs to be restarted.
     * check like:
     *
     *  DarkWallet.apiVersion === DarkWallet.core.servicesStatus.apiVersion
     */
    apiVersion: 5,

    /**
     * Get the wallet service.
     * 
     * @returns {Object}
     */
    get core() {return chrome.extension.getBackgroundPage();},

    /**
     * Get a service from the background script.
     * 
     * @returns {Object}
     */
    get service() {return DarkWallet.core.getServices();},

    /**
     * Identity key ring. Holds all identities.
     * 
     * @returns {Object}
     */
    getKeyRing: function() {return DarkWallet.core.getKeyRing();},

    /**
     * Light client
     * 
     * @returns {Object}
     */
    getClient: function() {return DarkWallet.core.getClient();},

    /**
     * Get identity
     * 
     * @param {Number} [idx] Index of the identity, default is current.
     * @returns {Object}
     */
    getIdentity: function(idx) {return DarkWallet.core.getIdentity(idx);},

    /**
     * Lobby transport
     * 
     * @returns {Object}
     */
    getLobbyTransport: function() {return DarkWallet.core.getLobbyTransport();}
};
return DarkWallet;
});
