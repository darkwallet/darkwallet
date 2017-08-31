'use strict';

define(['darkwallet', 'bitcoinjs-lib', 'util/btc', 'util/bip47'], function(DarkWallet, Bitcoin, BtcUtils, PaymentCodes) {

function linkPaymentCode(password, pCodeKey, $wallet) {
    var identity = DarkWallet.getIdentity();
    var pCodePriv = Bitcoin.HDNode.fromBase58(identity.store.getPrivateData(password).pCodeKey);
    var pCodePocketPriv = pCodePriv.deriveHardened(0);
    createSendAddresses(pCodePocketPriv, pCodeKey, 0);
    createReceiveAddresses(pCodePocketPriv, pCodeKey, $wallet, 0);
    pCodeKey.paired = true;
}

function createSendAddresses(pCodePocketPriv, pCodeKey, start) {
    var identity = DarkWallet.getIdentity();
    var otherCode = pCodeKey.address;
    var sending = start?pCodeKey.addresses:[];

    for(var seq=start; seq<start+10; seq++) {
      // create sending addresses (default 10)
      var sendPubKey = PaymentCodes.send(pCodePocketPriv, otherCode, seq);

      sending.push([sendPubKey.getAddress(Bitcoin.networks[identity.wallet.network]).toString(), false]);
    }
    // addresses must now be added to wallet...
    console.log(sending, otherCode, pCodeKey);

    pCodeKey.addresses = sending;
}

function createReceiveAddresses(pCodePocketPriv, pCodeKey, $wallet, start) {
    var identity = DarkWallet.getIdentity();
    var otherCode = pCodeKey.address;

    for(var seq=start; seq<start+10; seq++) {
      // create receiving addresses (default 10)
      var recvPubKey = PaymentCodes.receive(pCodePocketPriv, otherCode, seq);
      var id = [0, 'p', otherCode, seq];
      var walletAddress = identity.wallet.pubKeys[id];

      if (!walletAddress) {
         walletAddress = identity.wallet.storePublicKey(id, recvPubKey, {'type': 'pcode'});
      }
      // add the address to the wallet
      $wallet.initAddress(walletAddress);
    }

}


function extendSend(password, needsExtension) {
    var identity = DarkWallet.getIdentity();
    var pCodePriv = Bitcoin.HDNode.fromBase58(identity.store.getPrivateData(password).pCodeKey);
    var pCodePocketPriv = pCodePriv.deriveHardened(0);
    for(var i=0; i<needsExtension.contacts.length; i++) {
        var contact = needsExtension.contacts[i];
        var otherCode = contact.address;
        var pCodeKey = getContactPCodeKey(contact, otherCode);
        var last = pCodeKey.addresses.length;
        createSendAddresses(pCodePocketPriv, pCodeKey, last);
    }
}


function unlinkPaymentCode(pCodeKey, $wallet) {
    var identity = DarkWallet.getIdentity();
    var otherCode = pCodeKey.address;
    var deleted=true;
    var index=-1;
    var pocket = identity.wallet.pockets.getPocket(0, 'hd');
    while(deleted) {
        deleted = false;
        index += 1;
        var id = [0, 'p', otherCode, index];
        var walletAddress = identity.wallet.pubKeys[id];
        if (walletAddress) {
            $wallet.removeAddress(walletAddress);
            deleted = true;
            pocket.removeAddress(walletAddress);
        }
    }
    pCodeKey.paired = false;
}

var getContactPCodeKey = function(contact, address) {
    if (contact.mainKey.address == address) {
        return contact.mainKey;
    }
    for(var i=0; i<contact.pubKeys.length; i++) {
        if (contact.pubKeys[i].address == address) {
            return contact.pubKeys[i];
        }
    }
}

var getPaymentAddresses = function(contact, address) {
     var needsExtension = false;
     var contactKey = getContactPCodeKey(contact, address);
     for(var i=0; i<contactKey.addresses.length; i++) {
         if (contactKey.addresses[i][1] == false) {
             contactKey.addresses[i][1] = true;
             if (i > (contactKey.addresses.length-5)) {
                 needsExtension = true;
             }
             return {address: contactKey.addresses[i][0], extend: needsExtension};
         }
     }
     // Need to extend addresses
     return {address: false};
}

var replacePaymentCodes = function(spend) {
    var identity = DarkWallet.getIdentity();
    var contacts = spend.contacts;
    var recipients = spend.recipients;
    var needsExtension = {contacts: [], recipients: [], full: true};

    for(var i=0; i<contacts.length; i++) {
        if (BtcUtils.isPaymentCode(contacts[i].address)) {
            var contact = contacts[i].contact;
            var next = PCodeUtils.getNext(contact, contacts[i].address);
            if (next.address) {
                recipients[i].address = next.address;
                if (next.extend) {
                    needsExtension.contacts.push(contacts[i]);
                    needsExtension.recipients.push(recipients[i]);
                }
            } else {
                needsExtension.contacts.push(contacts[i]);
                needsExtension.recipients.push(recipients[i]);
                needsExtension.full = false;
            }
        }
    }
    return needsExtension;
}



return {link: linkPaymentCode,
    unlink: unlinkPaymentCode,
    getNext: getPaymentAddresses,
    replace: replacePaymentCodes,
    extendSend: extendSend};

});
