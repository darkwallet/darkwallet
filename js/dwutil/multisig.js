define(['darkwallet', 'bitcoinjs-lib'], function(DarkWallet, Bitcoin) {

// Class for dark wallet multisig funds
function MultisigFund(multisig) {
    // Multisig here is linked to the model store
    this.multisig = multisig;

    // Participants is a list of detected contacts
    this.participants = this.detectParticipants();

    // Tasks is a list of tasks, each linked to the store.
    this.tasks = this.detectTasks();

    // Whether the user can sign in this fund
    this.canSign = this.participants.filter(function(participant) {return participant.type=='me';});
}

// Create a profile out of a public key by looking in contacts and wallet.
MultisigFund.prototype.detectParticipant = function(pubKeyBytes) {
    var identity = DarkWallet.getIdentity();

    // Ensure we check the compressed version for my address
    var myPubKey = new Bitcoin.ECPubKey(pubKeyBytes, true);
    var myAddress = myPubKey.getAddress();

    var compressed = (pubKeyBytes.length == 33);

    // Initially show the address for the compressed key, not necessarily the
    // one we know about the contact if they're using uncompressed addresses
    var contactAddress = new Bitcoin.ECPubKey(pubKeyBytes, compressed);

    var participant = { name: contactAddress.toString(),
                        pubKey: pubKeyBytes,
                        hash: contactAddress.toHex() };

    var walletAddress = identity.wallet.getWalletAddress(myAddress);
    if (walletAddress) {
        // Current identity
        participant.type = 'me';
        participant.name = identity.name;
        participant.address = walletAddress;
        // In some cases would not be the stealth identifier.
        // Also, doing it like this so it would show the same as in contacts..
        participant.hash = Bitcoin.CryptoJS.SHA256(walletAddress.stealth).toString();
    } else {
        // Check if it's a contact
        var contact = identity.contacts.findByPubKey(pubKeyBytes);
        if (contact) {
            participant.name = contact.name;
            participant.hash = contact.hash;
            participant.type = 'contact';
        }
    }
    return participant;
};

// Detect participants for a fund from contacts and wallet.
MultisigFund.prototype.detectParticipants = function() {
    // TODO: Not very efficient, should keep track in some way
    var self = this;
    var participants = [];

    this.multisig.pubKeys.forEach(function(pubKey) {
        participants.push(self.detectParticipant(pubKey));
    });

    return participants;
}

// Check tasks and put some info in the pocket
MultisigFund.prototype.detectTasks = function() {
    var fund = this.multisig;
    var identity = DarkWallet.getIdentity();
    var res = [];
    // Check pending tasks for fund
    var tasks = identity.tasks.tasks.multisig;
    if (tasks) {
        tasks.forEach(function(task) {
            var addresses = task.pending.map(function(p){return p.address});
            if (addresses.indexOf(fund.address) != -1) {
                var tx = new Bitcoin.Transaction(task.tx);
                res.push({tx: tx, task: task});
            }
        });
    }
    return res;
};

return MultisigFund;

});
