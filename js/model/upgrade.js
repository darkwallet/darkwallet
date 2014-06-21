/**
 * Upgrade Module to manage store upgrades
 */
'use strict';

define(['util/btc'], function(BtcUtils) {
// DarkWallet namespace for the local storage.
var DW_NS = 'dw:identity:';

/**
 * Upgrade version 3 to version 4
 */

function Upgrade3To4(store) {
    // We change txdb to contain an array so we can store several fields.
    if (store.transactions && Object.keys(store.transactions).length && !Array.isArray(store.transactions[Object.keys(store.transactions)[0]])) {
        Object.keys(store.transactions).forEach(function(txHash) {
            if (!Array.isArray(store.transactions[txHash])) {
                store.transactions[txHash] = [store.transactions[txHash]];
            }
        });
    }
    return true;
}
 
/**
 * Upgrade version 2 to version 3
 */

function Upgrade2To3(store) {
    // Reset the stealth counter so stealth will be downloaded from the start
    store.lastStealth = 0;
    return true;
}
 
/**
 * Upgrade version 1 to version 2
 */

function Upgrade1To2(store) {
    if (!store.mpk) {
        console.log("Wallet without mpk!", store.mpk);
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
    // If no scankeys need to regenerate
    if (!store.scankeys || (store.scankeys.length == 0)) {
        // Can't finish the upgrade, need user to regenerate keys
        console.log('[upgrade] You need to reseed the wallet to generate stealth scanning keys!');
        store.reseed = true;
        return false;
    }
    return true;
}

/**
 * Upgrade a given store
 * @return true of false if the store was changed and should be saved
 */
function Upgrade(store) {
    if (store.version == 4) {
        return false;
    }

    console.log("[upgrade] Upgrading to version 3")

    // 0 to 1
    if (!store.version) {
        store.version = 1;
    }
    // 1 to 2
    if ((store.version == 1) && Upgrade1To2(store)) {
        store.version = 2;
        console.log("[upgrade] Upgraded to version 2")
    }
    // 2 to 3
    if ((store.version == 2) && Upgrade2To3(store)) {
        store.version = 3;
        console.log("[upgrade] Upgraded to version 3")
    }
    // 3 to 4
    if ((store.version == 3) && Upgrade3To4(store)) {
        store.version = 4;
        console.log("[upgrade] Upgraded to version 4")
    }
    return true;
}

return Upgrade;
});
