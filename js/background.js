
var keyRing = new IdentityKeyRing();
var obeliskClient = new ObeliskClient();
var currentIdentity = 0;

var identityNames = [];

var connected = false;

var currentHeight = 0;

/***************************************
/* Identities
 */

// Load identity names
keyRing.loadIdentities(function(names) {
    if (!names) {
       console.log("bad loading");
       return;
    }
    // get the first identity
    //keyRing.get(names[0], loadIdentity);
});

var getAvailableIdentities = function() {
    return keyRing.availableIdentities;
};

var loadIdentity = function(idx, userCallback) {
    var name = keyRing.availableIdentities[idx];
    console.log("load", name);
    keyRing.get(name, function(identity) {
        identity.history.update = function() { sendInternalMessage({name: 'guiUpdate'}); };
        userCallback(identity);
    });
}

// Get an identity from the keyring
var getIdentity = function(idx, loadIdentity) {
    var identity = keyRing.availableIdentities[idx];
    return keyRing.identities[identity];

}

/***************************************
/* Communications
 */
var sendInternalMessage = function(msg) {chrome.runtime.sendMessage(chrome.runtime.id, msg)};

var addListener = function(callback) {
    chrome.runtime.onMessage.addListener(callback);
};

/***************************************
/* History and address subscription
 */
function historyFetched(err, walletAddress, history) {
    var client = obeliskClient.client;
    var identity = getIdentity(0);

    // pass to the wallet to process outputs
    identity.wallet.processHistory(walletAddress.address, history);

    // now subscribe the address for notifications
    client.subscribe(walletAddress.address, function(err, res) {
        console.log("subscribed", walletAddress.address, err, res);

        // fill history after subscribing to ensure we got all histories already (for now).
        identity.history.fillHistory(history);
    }, function(addressUpdate) {
        console.log("update", addressUpdate)
    });
    sendInternalMessage({name: "balanceUpdate"});
}

// Start up history for an address
function initAddress(walletAddress) {
    var client = obeliskClient.client;
    var identity = getIdentity(0);
    client.fetch_history(walletAddress.address, function(err, res) { historyFetched(err, walletAddress, res); });
    if (walletAddress.history) {
        identity.history.fillHistory(walletAddress.history)
    }
}

/***************************************
/* Global communications
 */

// Handle initial connection to obelisk
function heightFetched(err, height) {
    currentHeight = height;
    // sendInternalMessage({name: "height", value: height});
    console.log("height fetched", height);
}

function handleConnect() {
    var client = obeliskClient.getClient();
    client.fetch_last_height(heightFetched);

    // get balance for addresses
    var identity = getIdentity(0);
    Object.keys(identity.wallet.pubKeys).forEach(function(pubKeyIndex) {
        var walletAddress = identity.wallet.pubKeys[pubKeyIndex];
        if (walletAddress.index.length > 1) {
            initAddress(walletAddress);
        }
    });
}
var connect = function(userCallback) {
    console.log("connect");
    if (connected) {
        userCallback()
    } else {
        obeliskClient.connect('ws://85.25.198.97:8888', function() {
            handleConnect(); userCallback();
        });
        connected = true;
    }
}


/***************************************
/* Bindings for the page window so we can have easy access
 */

window.connect = connect;

window.loadIdentity = loadIdentity;
window.getIdentity = getIdentity;
window.getAvailableIdentities = getAvailableIdentities;

window.getKeyRing = function() {
    return keyRing;
}

window.getClient = function() {
    return obeliskClient.client;
}

window.initAddress = initAddress;

window.addListener = addListener
window.sendInternalMessage = sendInternalMessage;


