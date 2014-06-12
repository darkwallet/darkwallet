'use strict';

define(['darkwallet', 'bitcoinjs-lib'], function(DarkWallet, Bitcoin) {

var convert = Bitcoin.convert;

/**
 * Class for dark wallet multisig funds
 */
function MultisigFund(multisig) {
    // Multisig here is linked to the model store
    this.multisig = multisig;

    // Indexes we control
    this.me = [];

    // Participants is a list of detected contacts
    this.participants = this.detectParticipants();

    // Tasks is a list of tasks, each linked to the store.
    this.tasks = this.detectTasks();
}


/**
 * Create a profile out of a public key by looking in contacts and wallet.
 */
MultisigFund.prototype.detectParticipant = function(pubKeyBytes, i) {
    var identity = DarkWallet.getIdentity();

    // Ensure we check the compressed version for my address
    var myPubKey = new Bitcoin.ECPubKey(pubKeyBytes, true);
    var myAddress = myPubKey.getAddress(identity.wallet.versions.address);

    var participant = { pubKey: pubKeyBytes };

    var walletAddress = identity.wallet.getWalletAddress(myAddress);
    if (walletAddress) {
        // Current identity
        participant.type = 'me';
        this.me.push(i);
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
        } else {
            // Just set some values
            var compressed = (pubKeyBytes.length == 33);

            var contactAddress = new Bitcoin.ECPubKey(pubKeyBytes, compressed);
            participant.name = contactAddress.toString();
            participant.hash = contactAddress.toHex();
        }
    }
    return participant;
};


/**
 * Detect participants for a fund from contacts and wallet.
 */
MultisigFund.prototype.detectParticipants = function() {
    // TODO: Not very efficient, should keep track in some way
    var self = this;
    var participants = [];

    this.multisig.pubKeys.forEach(function(pubKey, i) {
        participants.push(self.detectParticipant(pubKey, i));
    });

    return participants;
}


/**
 * Check tasks and put some info in the pocket
 */
MultisigFund.prototype.detectTasks = function() {
    var self = this;
    var fund = this.multisig;
    var identity = DarkWallet.getIdentity();
    var res = [];
    // Check pending tasks for fund
    var tasks = identity.tasks.tasks.multisig;
    if (tasks) {
        tasks.forEach(function(task) {
            var addresses = task.pending.map(function(p){ return p.address; });

            if (addresses.indexOf(fund.address) != -1) {
                var canSign = self.me.slice();
                // See if our indexes are signed
                if (self.me.length > 0) {
                    task.pending.forEach(function(p){
                        var signed = Object.keys(p.signatures);
                        canSign = canSign.filter(function(i) {return (signed.indexOf(""+i) == -1)});
                    });
                }

                var tx = new Bitcoin.Transaction(task.tx);
                res.push({tx: tx, task: task, canSign: canSign});

            }
        });
    }
    return res;
};


/**
 * Order signatures for this multisig
 */
MultisigFund.prototype.organizeSignatures = function(hexSigs) {
    var signatures = [];
    var multisig = this.multisig;
    multisig.participants.forEach(function(participant, i) {
        if (hexSigs.hasOwnProperty(i)) {
            signatures.push(hexSigs[i]);
        } else {
            // do nothing
        }
    });
    return signatures;
}


/**
 * Check if we have enough signatures and put them into the transaction
 */
MultisigFund.prototype.finishTransaction = function(spend) {
    var self = this;
    var multisig = this.multisig;
    var script = convert.hexToBytes(multisig.script);

    var finished = true;
    spend.task.pending.forEach(function(input) {
        var hexSigs = self.organizeSignatures(input.signatures);

        if (Object.keys(input.signatures).length >= multisig.m) {
            // convert inputs to bytes
            var sigs = hexSigs.map(function(sig) {return sig?convert.hexToBytes(sig):sig;});
            // apply multisigs
            spend.tx.applyMultisigs(input.index, script, sigs, 1);
        } else {
            finished = false;
        }
    });
    if (finished) {
        spend.task.tx = spend.tx.serializeHex();
        return spend.tx;
    }
};


/**
 * Import a signature
 */
MultisigFund.prototype.importSignature = function(sigHex, spend) {
    var added = false;
    var multisig = this.multisig;

    var sig;
    try {
       sig = convert.hexToBytes(sigHex);
    } catch(e) {
       throw Error('Malformed signature');
    }

    // Check where this signature goes
    var script = new Bitcoin.Script(convert.hexToBytes(multisig.script));
    spend.task.pending.forEach(function(input) {
        var txHash = spend.tx.hashTransactionForSignature(script, input.index, 1);
        multisig.pubKeys.forEach(function(pubKey, pIdx) {
            if (Bitcoin.ecdsa.verify(txHash, sig, pubKey)) {
                input.signatures[pIdx] = sigHex;
                added = true;
            }
        });
    });
    return added;
};


/**
 * Get a spend task from the given tx hash
 */
MultisigFund.prototype.getSpend = function(txHash) {
    for(var i=0; i<this.tasks.length; i++) {
        var spend = this.tasks[i];
        var hash = convert.bytesToHex(spend.tx.getHash());
        if (hash == txHash) {
            return spend;
        }
    }
};

/**
 * Import a partial transaction into the fund
 */
MultisigFund.prototype.importTransaction = function(serializedTx) {
    // import transaction here
    var identity = DarkWallet.getIdentity();
    var multisig = this.multisig;
    var walletAddress = identity.wallet.getWalletAddress(multisig.address);

    // we import the tx
    var tx;
    try {
        tx = Bitcoin.Transaction.deserialize(serializedTx);
    } catch(e) {
        throw Error('Malformed transaction');
    }
    // Find our inputs
    var inputs = identity.wallet.txForAddress(walletAddress, tx);

    if (inputs.length == 0) {
        throw Error('Transaction is not for this multisig');
    }

    // Check if we have the tx in the identity store
    var tasks = identity.tasks.getTasks('multisig');
    tasks.forEach(function(task) {
        if (task.tx == serializedTx) {
            throw Error('Already have this transaction!');
        }
    });

    // Now create the task
    var pending = [];
    inputs.forEach(function(input) {
        var out = input.outpoint.hash+':'+input.outpoint.index;
        pending.push({output: out, address: input.address, index: input.index, signatures: {}, type: 'multisig'});
    });
    var task = {tx: serializedTx, 'pending': pending, stealth: false};
    var spend = {tx: tx, task: task};

    // add as task in the store
    identity.tasks.addTask('multisig', task);
    // Maybe should be imported here but now it's done on the angular controller..
    this.tasks.push(spend)
    return spend;
};


/**
 * Continue signing after getting the password
 */
MultisigFund.prototype.signTransaction = function(password, spend, inputs) {
    var self = this;
    var identity = DarkWallet.getIdentity();
    var script = convert.hexToBytes(this.multisig.script);

    var signed = false;

    // find key
    this.participants.forEach(function(participant, pIdx) {
        if (participant.type == 'me') {
            var seq = participant.address.index;
            identity.wallet.getPrivateKey(seq, password, function(privKey) {
                inputs.forEach(function(input, i) {
                    var sig = spend.tx.p2shsign(input.index, script, privKey.toBytes(), 1);
                    var hexSig = convert.bytesToHex(sig);
                    spend.task.pending[i].signatures[pIdx] = hexSig
                    // propagate transaction
                    DarkWallet.service.multisigTrack.sign(self.multisig, spend.tx, sig);
                    signed = true;
                });
                // TODO: may want to remove just this participant here
                spend.canSign = [];
                spend.task.signed = true;
            });
        }
    });
    return signed;
};


/**
 * Sign a transaction with our keys
 */
MultisigFund.prototype.signTxForeign = function(foreignKey, spend) {
    var identity = DarkWallet.getIdentity();
    var multisig = this.multisig;
    var walletAddress = identity.wallet.getWalletAddress(multisig.address);

    var inputs = identity.wallet.txForAddress(walletAddress, spend.tx);
    if (inputs.length == 0) {
         // Shouldn't happen
         throw Error('Transaction is not for this multisig');
    }

    var script = convert.hexToBytes(multisig.script);
    var privKey = new Bitcoin.ECKey(foreignKey, true);
    var signingAddress = privKey.getAddress(identity.wallet.versions.address).toString();

    var signed = false;

    // Check each participant
    this.participants.forEach(function(participant, pIdx) {
        if (participant.type != 'me') {     // can't be me if we're importing the key
            var pubKey = new Bitcoin.ECPubKey(participant.pubKey, true);

            if (pubKey.getAddress(identity.wallet.versions.address).toString() == signingAddress) {
                // It's this position, so sign all inputs
                inputs.forEach(function(input, i) {
                    var sig = spend.tx.p2shsign(input.index, script, privKey.toBytes(), 1);
                    var hexSig = convert.bytesToHex(sig);
                    spend.task.pending[i].signatures[pIdx] = hexSig;
                    DarkWallet.service.multisigTrack.sign(multisig, spend.tx, sig);
                    signed = true;
                });
            }
        }
    });
    return signed;
}


/**
 * Get valid inputs for this transaction
 * @returns [{output: utxo.receive, address: utxo.address, index: idx, signatures: {}, type: outAddress?outAddress.type:'signature'}, ...]
 */
MultisigFund.prototype.getValidInputs = function(tx) {
    // import transaction here
    var identity = DarkWallet.getIdentity();
    var multisig = this.multisig;
    var walletAddress = identity.wallet.getWalletAddress(multisig.address);

    if (walletAddress) {
        // we import the tx
        var inputs = identity.wallet.txForAddress(walletAddress, tx);
        return inputs;
    }
    return [];
};

return MultisigFund;

});
