/**
 * Upgrade Module to manage store upgrades
 */
'use strict';

define(['util/btc'], function(BtcUtils) {
// DarkWallet namespace for the local storage.
var DW_NS = 'dw:identity:';

/**
 * Upgrade version 1 to version 2
 */

function Upgrade1To2(store) {
    // If no scankeys need to regenerate
    if (store.scankeys.length == 0) {
        console.log('You need to reseed the wallet to generate stealth scanning keys!');
        store.reseed = true;
        return false;
    }
    if (!store.mpk) {
        console.log("Wallet without mpk!", this.mpk);
        // throw Error("No mpk!");
    }
 
    // Upgrade Public Keys
    var pubKeys = store.pubkeys;

    var toRemove = [];
    Object.keys(pubKeys).forEach(function(index) {
        var walletAddress = pubKeys[index];
        // Check for malformed address
        if (walletAddress == null || walletAddress.index == null) {
            toRemove.push(index)
            return;
        }
        // Start mpk for pocket addresses
        if (walletAddress.index.length == 1) {
            walletAddress.mpk = BtcUtils.deriveMpk(store.mpk, walletAddress.index[0]);
        }
    });
    // Cleanup malformed addresses
    toRemove.forEach(function(index) {
        console.log("[model] Deleting", pubKeys[index]);
        delete pubKeys[index];
    });

    // Upgrade Public Keys
    var contacts = store.contacts;

    if (!Array.isArray(contacts)) {
        store.contacts = [];
        contacts = store.contacts;
    }
    // Cleanup empty keys
    contacts.forEach(function(contact) {
        if (!contact) {
            console.log("[upgrade] Delete contact", contact);
            contacts.splice(contacts.indexOf(contact), 1);
            return;
        }
    });
    // Upgrade pocket store to new format
    if (typeof store.pockets[0] == 'string') {
        for(var i=0; i< store.pockets.length; i++) {
            store.pockets[i] = {'name': store.pockets[i]};
        };
    }
    return true;
}

/**
 * Upgrade a given store
 */
function Upgrade(store) {
    if (store.version == 2) {
        return false;
    }

    console.log("[upgrade] Upgrading to version 2")

    if (Upgrade1To2(store)) {
        store.version = 2;
        console.log("[upgrade] Upgraded to version 2")
        return true;
    }
}

return Upgrade;
});
