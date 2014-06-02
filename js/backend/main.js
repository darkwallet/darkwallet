/*
 * @fileOverview Background service running for the wallet
 */
'use strict';

require([
    'backend/port',
    'backend/services/crypto',
    'backend/services/lobby',
    'backend/services/obelisk',
    'backend/services/wallet',
    'backend/services/stealth',
    'backend/services/gui',
    'backend/services/ticker',
    'backend/services/mixer',
    'backend/services/multisig_track',
    'backend/services/safe',
    'backend/services/badge',
    'backend/services/notifier',
    'backend/services/content',
    'backend/services/ctxmenus'],
    function(Port) {

var serviceClasses = [].splice.call(arguments, 1);

function DarkWalletService(serviceClasses) {
    var self = this;

    // Backend services
    var services = this.initializeServices(serviceClasses);
    var servicesStatus = this.servicesStatus;


    /***************************************
    /* Hook up some utility functions
     */

    this.loadIdentity = function(idx) {
        return services.wallet.loadIdentity(idx);
    };

    // Get an identity from the keyring
    this.getIdentity = function(idx) {
        return services.wallet.getIdentity(idx);
    };
    this.getCurrentIdentity = function() {
        return services.wallet.getCurrentIdentity();
    };
    this.getLobbyTransport = function() {
        return services.lobby.getLobbyTransport();
    };

    // Start up history for an address
    this.initAddress = function(walletAddress) { return services.wallet.initAddress(walletAddress); }

    /***************************************
    /* Global communications
     */

    Port.connect('wallet', function(data) {
        // wallet closing
        if (data.type == 'closing') {
            services['obelisk'].disconnect();
        }
    });

    this.connect = function(connectUri) {
        var identity = services.wallet.getCurrentIdentity();
        connectUri = connectUri || identity.connections.getSelectedServer().address;
        if (!connectUri) {
           console.log("no uri disconnecting!");
           return;
        }

        console.log("[main] connecting", connectUri);
        servicesStatus.gateway = 'connecting';
        services.obelisk.connect(connectUri, function(err) {
            if (err) {
                servicesStatus.gateway = 'error';
            } else {
                servicesStatus.gateway = 'ok';
                services.wallet.handleInitialConnect();
            }
        });
    };
    this.getKeyRing = function() {
        return services.wallet.getKeyRing();
    };

    this.getClient = function() {
        return services.obelisk.getClient();
    };
    
    this.getServices = function() {
        return self.service;
    };
}

/**
 * Instantiates an object and prepares a getter function for each service.
 * Getter functions are available under `service` property, for example you can
 * get obelisk from `obj.service.obelisk`.
 * @param {Object[]} serviceClasses Array with the services modules to be instantialzed
 * @return {Object[]} Object that contains the real services
 * @private
 */
DarkWalletService.prototype.initializeServices = function(serviceClasses) {
    this.service = {};
    var services = {};
    
    for(var i in serviceClasses) {
        var service = new serviceClasses[i](this);
        if (!service.name) {
          throw Error('Service ' + serviceClasses[i].name + ' has no name property');
        }
        if (Object.keys(services).indexOf(service.name) !== -1) {
          throw Error('Name of service ' + service.name + ' repeated');
        }
        services[service.name] = service;
    }
    
    // Public API
    for(var i in services) {
        Object.defineProperty(this.service, i, {
            get: function() {
                var j = services[i];
                return function() {
                    return j;
                };
            }()
        });
    };
    
    this.servicesStatus = { gateway: 'offline', obelisk: 'offline' };
    return services;
};

/***************************************
/* Communications
 */
var sendInternalMessage = function(msg) {
    chrome.runtime.sendMessage(chrome.runtime.id, msg);
};

var addListener = function(callback) {
    chrome.runtime.onMessage.addListener(callback);
};


/***************************************
/* Service instance that will be running in the background page
 */
var service = new DarkWalletService(serviceClasses);


/***************************************
/* Bindings for the page window so we can have easy access
 */

window.connect = function(_server) { return service.connect(_server); };

window.loadIdentity = service.loadIdentity;
window.getIdentity = function(idx) { return service.getIdentity(idx); };
window.getCurrentIdentity = service.getCurrentIdentity;

window.getKeyRing = service.getKeyRing;
window.servicesStatus = service.servicesStatus;
window.getLobbyTransport = service.getLobbyTransport;

window.getClient = service.getClient;
window.getServices = service.getServices;

window.initAddress = function(_w) {return service.initAddress(_w);};

window.addListener = addListener;
window.sendInternalMessage = sendInternalMessage;
});
