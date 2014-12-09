/*
 * @fileOverview Main object for generic dark wallet api.
 */
'use strict';

define(function() {

var background = function() {return chrome.extension.getBackgroundPage().api; };

// DarkWallet object.
var DarkWallet = {

    /**
     * Internal api version. Gets saved by the backend as servicesStatus.apiVersion,
     * so frontend code can see if the backend needs to be restarted.
     * check like:
     *
     *  DarkWallet.core.isApiUpdated(DarkWallet.apiVersion, callback);
     */
    apiVersion: 5,

    /**
     * Get the wallet service.
     *
     * @returns {Object}
     */
    get core() {
        return {
            initAddress: background().initAddress,
            isApiUpdated: background().isApiUpdated,
            getServicesStatus: background().getServicesStatus,
            connect: background().connect,
            loadIdentity: background().loadIdentity
        };
    },

    /**
     * Get a service from the background script.
     *
     * @returns {Object}
     */
    get service() {return background().getServices();},

    /**
     * Identity key ring. Holds all identities.
     *
     * @returns {Object}
     */
    get keyring() {
        return {
            getIdentities: background().keyring.getIdentities,
            getIdentityNames: background().keyring.getIdentityNames,
            loadIdentities: background().keyring.loadIdentities,
            save: background().keyring.save,
            close: background().keyring.close,
            getSize: background().keyring.getSize,
            getRaw: background().keyring.getRaw,
            clear: background().keyring.clear,
            remove: background().keyring.remove
        };
    },

    /**
     * Light client
     *
     * @returns {Object}
     */
    get client() {
        return {
            is_connected: background().client.is_connected,

            fetch_history: background().client.fetch_history,
            fetch_transaction: background().client.fetch_transaction,
            fetch_stealth: background().client.fetch_stealth,
            fetch_ticker: background().client.fetch_ticker,
            fetch_block_header: background().client.fetch_block_header,
            fetch_last_height: background().client.fetch_last_height,

            subscribe: background().client.subscribe,
            unsubscribe: background().client.unsubscribe,
            broadcast_transaction: background().client.broadcast_transaction
        };
    },

    /**
     * Get identity
     *
     * @param {Number} [idx] Index of the identity, default is current.
     * @returns {Object}
     */
    getIdentity: function(idx) {return background().getIdentity(idx);},

    /**
     * Lobby transport
     *
     * @returns {Object}
     */
    get lobbyTransport() {
        return {
            channel: {
                addCallback: background().lobbyTransport.channel.addCallback,
                removeCallback: background().lobbyTransport.channel.removeCallback,
                sendOpening: background().lobbyTransport.channel.sendOpening,
                sendPairing: background().lobbyTransport.channel.sendPairing,
                sendBeacon: background().lobbyTransport.channel.sendBeacon,
                newSession: background().lobbyTransport.channel.newSession,
                postEncrypted: background().lobbyTransport.channel.postEncrypted,
                postDH: background().lobbyTransport.channel.postDH
            },
            getTransport: background().lobbyTransport.getTransport,
            initChannel: background().lobbyTransport.initChannel,
            closeChannel: background().lobbyTransport.closeChannel
        };
    }
};
return DarkWallet;
});
