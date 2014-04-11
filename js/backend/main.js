/*
 * @fileOverview Background service running for the wallet
 */
require(['backend/services',
         'backend/services/lobby',
         'backend/services/obelisk',
         'backend/services/wallet',
         'backend/services/gui',
         'backend/services/ticker',
         'backend/services/mixer',
         'backend/services/notifier',
         'backend/services/ctxmenus'],
function(Services, LobbyService, ObeliskService, WalletService, GuiService, TickerService, MixerService, NotifierService, CtxMenusService) {

function DarkWalletService() {

    // Backend services
    var lobbyService = new LobbyService(this);
    var obeliskService = new ObeliskService(this);
    var walletService = new WalletService(this);
    var ctxMenusService = new CtxMenusService(this);
    var guiService = new GuiService(this);
    var tickerService = new TickerService(this);
    var mixerService = new MixerService(this);
    var notifierService = new NotifierService(this);

    var servicesStatus = { gateway: 'offline', obelisk: 'offline' };
    this.servicesStatus = servicesStatus;

    /***************************************
    /* Hook up some utility functions
     */
    this.getWalletService = function() {
        return walletService;
    }

    this.getTickerService = function() {
        return tickerService;
    }

    this.getMixerService = function() {
        return mixerService;
    }

    this.getNotifierService = function() {
        return notifierService;
    }

    this.loadIdentity = function(idx) {
        return walletService.loadIdentity(idx);
    }

    // Get an identity from the keyring
    this.getIdentity = function(idx) {
        return walletService.getIdentity(idx);
    }
    this.getCurrentIdentity = function() {
        return walletService.getCurrentIdentity();
    }
    this.getLobbyTransport = function() {
        return lobbyService.getLobbyTransport();
    }

    // Start up history for an address
    this.initAddress = function(walletAddress) { return walletService.initAddress(walletAddress) }

    /***************************************
    /* Global communications
     */

    this.connect = function(connectUri) {
        var identity = walletService.getCurrentIdentity();
        connectUri = connectUri || identity.connections.servers[identity.connections.selectedServer].address || 'wss://gateway.unsystem.net';
        servicesStatus.gateway = 'connecting';
        obeliskService.connect(connectUri, function(err) {
            if (err) {
                servicesStatus.gateway = 'error';
            } else {
                servicesStatus.gateway = 'ok';
                walletService.handleInitialConnect();
            }
        });
    }
    this.getKeyRing = function() {
        return walletService.getKeyRing();
    }

    this.getClient = function() {
        return obeliskService.getClient();
    }
    this.getObeliskClient = function() {
        return obeliskService;
    }
    this.getServices = function() {
        return Services;
    }
}

/***************************************
/* Communications
 */
var sendInternalMessage = function(msg) {
    chrome.runtime.sendMessage(chrome.runtime.id, msg)
};

var addListener = function(callback) {
    chrome.runtime.onMessage.addListener(callback);
};


/***************************************
/* Service instance that will be running in the background page
 */
var service = new DarkWalletService();


/***************************************
/* Bindings for the page window so we can have easy access
 */

window.connect = function(_server) { return service.connect(_server) };

window.loadIdentity = service.loadIdentity;
window.getIdentity = function(idx) { return service.getIdentity(idx); };
window.getCurrentIdentity = service.getCurrentIdentity;

window.getKeyRing = service.getKeyRing;
window.servicesStatus = service.servicesStatus;
window.getLobbyTransport = service.getLobbyTransport

window.getClient = service.getClient;
window.getServices = service.getServices;
window.getWalletService = service.getWalletService
window.getTickerService = service.getTickerService
window.getMixerService = service.getMixerService
window.getNotifierService = service.getNotifierService

window.initAddress = function(_w) {return service.initAddress(_w)};

window.addListener = addListener
window.sendInternalMessage = sendInternalMessage;
});

