/*
 * @fileOverview Background service running for the wallet
 */
require(['backend/services', 'backend/lobby', 'backend/obelisk', 'backend/wallet', 'backend/gui', 'backend/ctxmenus'],
function(Services, LobbyService, ObeliskService, WalletService, GuiService, CtxMenusService) {

function DarkWalletService() {

    // Backend services
    var lobbyService = new LobbyService(this);
    var obeliskService = new ObeliskService(this);
    var walletService = new WalletService(this);
    var ctxMenusService = new CtxMenusService(this);
    var guiService = new GuiService(this);

    /***************************************
    /* Hook up some utility functions
     */
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
        connectUri = connectUri || 'ws://85.25.198.97:8888';
        obeliskService.connect(connectUri, function() {
            walletService.handleInitialConnect();
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
window.getLobbyTransport = service.getLobbyTransport

window.getClient = service.getClient;
window.getServices = service.getServices;

window.initAddress = function(_w) {return service.initAddress(_w)};

window.addListener = addListener
window.sendInternalMessage = sendInternalMessage;
});

