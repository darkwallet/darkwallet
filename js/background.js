/*
 * @fileOverview Background service running for the wallet
 */
require(['model/keyring', 'obelisk'], function(IdentityKeyRing, ObeliskClient) {
function DarkWalletService() {
    var keyRing = new IdentityKeyRing();
    var obeliskClient = new ObeliskClient();

    var currentIdentity = 0;

    var identityNames = [];

    var connected = false;

    var currentHeight = 0;

    var isReady = 0;
    var readyCallbacks = [];

    /***************************************
    /* Identities
     */

    this.ready = function(callback) {
        if (isReady) {
            callback();
        } else {
            readyCallbacks.push(callback);
        }
    };

    // Load identity names
    keyRing.loadIdentities(function(names) {
        if (!names) {
           console.log("bad loading");
           return;
        }
        // get the first identity
        //keyRing.get(names[0], loadIdentity);
    });

    this.loadIdentity = function(idx, userCallback) {
        var name = keyRing.availableIdentities[idx];
        currentIdentity = name;
        console.log("load", name);
        keyRing.get(name, function(identity) {
            identity.history.update = function() { sendInternalMessage({name: 'guiUpdate'}); };
            userCallback(identity);
            isReady = true;
            readyCallbacks.forEach(function(cb) {cb();});
            readyCallbacks = [];
        });
    };

    // Get an identity from the keyring
    this.getIdentity = function(idx) {
        if (idx === null || idx === undefined) {
            return this.getCurrentIdentity();
        }
        var identity = keyRing.availableIdentities[idx];
        currentIdentity = identity;
        return keyRing.identities[identity];

    };
    this.getCurrentIdentity = function() {
        return keyRing.identities[currentIdentity];
    };
    /***************************************
    /* History and address subscription
     */
    function historyFetched(err, walletAddress, history) {
        if (err) {
            console.log("Error fetching history for", walletAddress.address);
            return;
        }
        var client = obeliskClient.client;
        var identity = this.getCurrentIdentity();

        // pass to the wallet to process outputs
        identity.wallet.processHistory(walletAddress.address, history);

        // now subscribe the address for notifications
        client.subscribe(walletAddress.address, function(err, res) {
            console.log("subscribed", walletAddress.address, err, res);

            // fill history after subscribing to ensure we got all histories already (for now).
            identity.history.fillHistory(history);
        }, function(addressUpdate) {
            console.log("update", addressUpdate);
        });
        sendInternalMessage({name: "balanceUpdate"});
    }
    // Start up history for an address
    this.initAddress = function(walletAddress) {
        var client = obeliskClient.client;
        if (!client) {
            // TODO manage this case better
            console.log("trying to init address but not connected yet!... skipping :P");
            return;
        }
        var identity = this.getCurrentIdentity();
        client.fetch_history(walletAddress.address, function(err, res) { historyFetched(err, walletAddress, res); });
        if (walletAddress.history) {
            identity.history.fillHistory(walletAddress.history);
        }
    };

    // Handle initial connection to obelisk
    function handleHeight(err, height) {
        currentHeight = height;
        //sendInternalMessage({name: "height", value: height});
        console.log("height fetched", height);
    }

    function handleInitialConnect() {
        var client = obeliskClient.getClient();
        client.fetch_last_height(handleHeight);

        // get balance for addresses
        var identity = this.getCurrentIdentity();
        Object.keys(identity.wallet.pubKeys).forEach(function(pubKeyIndex) {
            var walletAddress = identity.wallet.pubKeys[pubKeyIndex];
            if (walletAddress.index.length > 1) {
                this.initAddress(walletAddress);
            }
        });
    }

    /***************************************
    /* Global communications
     */

    this.connect = function(userCallback) {
        if (connected) {
            if (userCallback) {
                userCallback();
            }
        } else {
            obeliskClient.connect('ws://85.25.198.97:8888', function() {
                handleInitialConnect();
                if (userCallback) {
                    userCallback();
                }
            });
            connected = true;
        }
    };
    this.getKeyRing = function() {
        return keyRing;
    };

    this.getClient = function() {
        return obeliskClient.client;
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
/* Right click context menus.

Being able to exchange an identity over a public medium (say a forum or email)
is useful if you want to setup a multisig account or start an encrypted
commnunication chanel.

In the future we could even have options to paste special data which can
be recognised or loaded by other wallets. i.e you make a pledge and people
sign inputs posting the results one after another on a forum.
 */
function importIdentity(info) {
}
function pasteIdentity(info) {
/*
    //var focus = document.activeElement;
    var focus = focus.getElementsByTagName("textarea")[0];
    var text = "my_identity is genjix!!";
    if (focus.tagName.toLowerCase() == "input" ||
        focus.tagName.toLowerCase() == "textarea")
    {
		// Get start and end position of caret
		var startPos = focus.selectionStart;
		var endPos = focus.selectionEnd;

		// insert text
		focus.value = focus.value.substring(0, startPos) + text +
			focus.value.substring(endPos, focus.value.length);

		// update caret position
		focus.setSelectionRange(startPos + text.length, startPos + text.length);
    }
*/
}
chrome.contextMenus.create({
    title: "Import identity",
    contexts: ["selection"],
    onclick: importIdentity
});
chrome.contextMenus.create({
    title: "Paste identity",
    contexts: ["editable"],
    onclick: pasteIdentity
});


/***************************************
/* Service instance that will be running in the background page
 */
var service = new DarkWalletService();


/***************************************
/* Bindings for the page window so we can have easy access
 */

window.connect = service.connect;

window.loadIdentity = service.loadIdentity;
window.getIdentity = function(idx) { return service.getIdentity(idx); };
window.getCurrentIdentity = service.getCurrentIdentity;

window.getKeyRing = service.getKeyRing;

window.getClient = service.getClient;
window.ready = function(_cb) {service.ready(_cb);};

window.initAddress = function(_w) {return service.initAddress(_w);};

window.addListener = addListener;
window.sendInternalMessage = sendInternalMessage;
});
