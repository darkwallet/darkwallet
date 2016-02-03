'use strict';

define(['darkwallet', 'bitcoinjs-lib', 'util/btc', 'util/bip47'], function(DarkWallet, Bitcoin, BtcUtils, PaymentCodes) {

function linkPaymentCode(password, pcodeKey, $wallet) {
    var identity = DarkWallet.getIdentity();
    var pCodePriv = Bitcoin.HDNode.fromBase58(identity.store.getPrivateData(password).pCodeKey);
    var pCodePocketPriv = pCodePriv.deriveHardened(0);
    var otherCode = pcodeKey.address;
    var sending = [];

    for(var seq=0; seq<10; seq++) {
      // create sending addresses (default 10)
      var sendPubKey = PaymentCodes.send(pCodePocketPriv, otherCode, seq);

      sending.push([sendPubKey.getAddress(Bitcoin.networks[identity.wallet.network]).toString(), false]);

      // create receiving addresses (default 10)
      var recvPubKey = PaymentCodes.receive(pCodePocketPriv, otherCode, seq);
      var id = [0, 'p', otherCode, seq];
      var walletAddress = identity.wallet.pubKeys[id];

      if (!walletAddress) {
         walletAddress = identity.wallet.storePublicKey(id, recvPubKey, {'type': 'pcode'});
      }
      $wallet.initAddress(walletAddress);
    }
    // addresses must now be added to wallet...
    pcodeKey.addresses = sending;

    pcodeKey.paired = true;
}

function unlinkPaymentCode(pcodeKey, $wallet) {
    var identity = DarkWallet.getIdentity();
    var otherCode = pcodeKey.address;
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
    pcodeKey.paired = false;
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
     var contactKey = getContactPCodeKey(contact, address);
     for(var i=0; i<contactKey.addresses.length; i++) {
         if (contactKey.addresses[i][1] == false) {
             contactKey.addresses[i][1] = true;
             return contactKey.addresses[i][0];
         }
     }
     // Need to extend addresses
     return false;
}

var replacePaymentCodes = function(spend) {
    var identity = DarkWallet.getIdentity();
    var contacts = spend.contacts;
    var recipients = spend.recipients;
    var needsExtension = {contacts: [], recipients: []};

    for(var i=0; i<contacts.length; i++) {
        if (BtcUtils.isPaymentCode(contacts[i].address)) {
            var contact = contacts[i].contact;
            var address = PCodeUtils.getNext(contact, contacts[i].address);
            if (address) {
                recipients[i].address = address;
            } else {
                needsExtension.contacts.push(contacts[i]);
                needsExtension.recipients.push(recipients[i]);
            }
        }
    }
    return needsExtension;
}


var extendSend = function(password, spend, needsExtension) {
    for(var i=0; i<needsExtension.contacts.length; i++) {
        var toExtend = needsExtension.contacts[i];
    }
}


return {link: linkPaymentCode,
    unlink: unlinkPaymentCode,
    getNext: getPaymentAddresses,
    replace: replacePaymentCodes,
    extendSend: extendSend};

});
