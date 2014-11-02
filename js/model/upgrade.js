/**
 * Upgrade Module to manage store upgrades
 */
'use strict';

define(['util/btc', 'bitcoinjs-lib'], function(BtcUtils, Bitcoin) {
// DarkWallet namespace for the local storage.
var DW_NS = 'dw:identity:';

function Upgrade4To5(store, identity, password) {
    // 1. adapt private keys
    var privData = identity.store.getPrivateData(password);
    var oldPrivKey = privData.privKey;
    var oldPrivKeys = privData.privKeys;
    var oldScanKeys = identity.store.get('scankeys');
    var oldIdKeys = identity.store.get('idkeys');
    var oldMpk = identity.store.get('mpk');

    identity.store.set('old-mpk', oldMpk);
    identity.store.set('old-idkeys', oldIdKeys);
    identity.store.set('old-scankeys', oldScanKeys);

    // generate completely overwrites the private data, calls store.save()
    identity.generate(privData.seed, password, identity.wallet.network);

    // get private data again to add the old key
    privData = identity.store.getPrivateData(password);
    privData.oldPrivKey = oldPrivKey;
    privData.privKeys = oldPrivKeys;

    // save the updated private data
    identity.store.setPrivateData(privData, password);

    // update identity
    identity.wallet.mpk = identity.store.get('mpk');
    identity.wallet.oldMpk = identity.store.get('old-mpk');
    identity.wallet.scanKeys = identity.store.get('scankeys');
    identity.wallet.idKeys = identity.store.get('idkeys');
    identity.wallet.oldScanKeys = identity.store.get('old-scankeys');


    // 2.b Add mpk to previous pockets
    var mpks = identity.store.get('mpks');
    var rootKey = Bitcoin.HDNode.fromBase58(privData.privKey);
    identity.wallet.pockets.hdPockets.forEach(function(pocketStore, i) {
        if (pocketStore) {
            if (!mpks[i]) {
                mpks[i] = rootKey.deriveHardened(i).toBase58(false);
            }
            pocketStore.mpk = mpks[i];
        }
    });

    // set version so we can start creating new addresses
    identity.reseed = false;
    identity.store.set('reseed', false);
    identity.store.set('version', 5);

    // 3. upgrade the pocket addresses (index with length 1)
    // ... user should not have funds in any pocket address since they will be deleted
    Object.keys(identity.wallet.pubKeys).forEach(function(index) {
        var walletAddress = identity.wallet.pubKeys[index];
        index = walletAddress.index;
        if (index.length === 1 && walletAddress.type === undefined) {
            var pocket = identity.wallet.pockets.getAddressPocket(walletAddress);
            // first remove the old address
            pocket.removeAddress(walletAddress);
            // and now create a new one
            if (index[0]%2 === 0) {
                pocket.createAddress([index[0]/2]);
            }
        }
        // also set all stealth as oldstealth
        if (walletAddress.type === 'stealth') {
            walletAddress.type = 'oldstealth';
        }
    });

    // 4. clean up old unused addresses
    Object.keys(identity.wallet.pubKeys).forEach(function(index) {
        var walletAddress = identity.wallet.pubKeys[index];
        index = walletAddress.index;
        if (index.length > 1 && walletAddress.type === undefined) {
            if (walletAddress.nOutputs === 0 && ['unused', 'pocket', 'change'].indexOf(walletAddress.label) > -1) {
                var pocket = identity.wallet.pockets.getAddressPocket(walletAddress);
                // remove it
                try {
                    pocket.removeAddress(walletAddress);
                } catch (e) {
                    console.log("error removing address", walletAddress);
                }
            }
        }
    });

    // 5. should create some new addresses?

    // 6. perform other long running cleanings

    Object.keys(identity.wallet.pubKeys).forEach(function(index) {
        var walletAddress = identity.wallet.pubKeys[index];
        // Cleanup if malformed
        if (!walletAddress){
            console.log("delete empty address", index);
            delete identity.wallet.pubKeys[index];
            return;
        }
        // Reindex // delete badly indexed
        if (walletAddress.type === 'readonly' && walletAddress.index[0] === index) {
            delete identity.wallet.pubKeys[index];
            if (!identity.wallet.pubKeys[walletAddress.index]) {
                // if it doesnt exist, relink it
                identity.wallet.pubKeys[walletAddress.index.slice(0)] = walletAddress;
            }
        }
    });

    return true;
}

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
function Upgrade(store, identity, password) {
    if (store.version == 5) {
        return false;
    }

    console.log("[upgrade] Upgrading to version 5")

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
    if (store.version == 4) {
        if (identity) {
            // Upgrade of 4 to 5 needs reseeding with live identity and password
            if (Upgrade4To5(store, identity, password)) {
                store.version = 5
                console.log("[upgrade] Upgraded to version 5")
            }
        } else {
            store.reseed = true;
        }
    }
    return true;
}

return Upgrade;
});
