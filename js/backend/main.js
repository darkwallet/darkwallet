/*
 * @fileOverview Background service running for the wallet
 */
require(['backend/port',
         'backend/services/lobby',
         'backend/services/obelisk',
         'backend/services/wallet',
         'backend/services/gui',
         'backend/services/ticker',
         'backend/services/mixer',
         'backend/services/notifier',
         'backend/services/ctxmenus'],
function(Port, LobbyService, ObeliskService, WalletService, GuiService, TickerService, MixerService, NotifierService, CtxMenusService) {

function DarkWalletService() {
  
    var services = {};

    // Backend services
    services.obelisk = new ObeliskService(this);
    services.wallet = new WalletService(this);
    services.ctxMenus = new CtxMenusService(this);
    services.gui = new GuiService(this);
    services.ticker = new TickerService(this);
    services.mixer = new MixerService(this);
    services.notifier = new NotifierService(this);
    services.lobby = new LobbyService(this);

    var servicesStatus = { gateway: 'offline', obelisk: 'offline' };
    this.servicesStatus = servicesStatus;

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
        connectUri = connectUri || identity.connections.servers[identity.connections.selectedServer].address || 'wss://gateway.unsystem.net';
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
    
    this.getService = function(name) {
        return services[name];
    };
}

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
var service = new DarkWalletService();


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
window.getService = service.getService;

window.initAddress = function(_w) {return service.initAddress(_w);};

window.addListener = addListener;
window.sendInternalMessage = sendInternalMessage;
});

