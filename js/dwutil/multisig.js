'use strict';

define(['darkwallet', 'bitcoinjs-lib', 'crypto-js'], function(DarkWallet, Bitcoin, CryptoJS) {

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
    var myPubKey = Bitcoin.ECPubKey.fromBytes(pubKeyBytes, true);
    var myAddress = myPubKey.getAddress(Bitcoin.networks[identity.wallet.network]);

    var participant = { pubKey: pubKeyBytes };

    var walletAddress = identity.wallet.getWalletAddress(myAddress.toString());
    if (walletAddress) {
        // Current identity
        participant.type = 'me';
        this.me.push(i);
        participant.name = identity.name;
        participant.address = walletAddress;
        // In some cases would not be the stealth identifier.
        // Also, doing it like this so it would show the same as in contacts..
        participant.hash = CryptoJS.SHA256(walletAddress.stealth).toString();
    } else {
        // Check if it's a contact
        var contact = identity.contacts.findByPubKey(pubKeyBytes);
        if (contact) {
            participant.name = contact.data.name;
            participant.hash = contact.data.hash;
            participant.type = 'contact';
            if (contact.findIdentityKey()) {
                participant.paired = true;
            }
        } else {
            // Just set some values
            var compressed = (pubKeyBytes.length === 33);

            var contactAddress = Bitcoin.ECPubKey.fromBytes(pubKeyBytes, compressed);
            participant.name = contactAddress.toHex();
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

            if (addresses.indexOf(fund.address) > -1) {
                var canSign = self.me.slice();
                // See if our indexes are signed
                if (self.me.length > 0) {
                    task.pending.forEach(function(p){
                        var signed = Object.keys(p.signatures);
                        canSign = canSign.filter(function(i) {return (signed.indexOf(""+i) === -1)});
                    });
                }

                var tx = Bitcoin.Transaction.fromHex(task.tx);
                res.push({tx: tx, task: task, canSign: canSign});

            }
        });
    }
    return res;
};

/**
 * Get the fundTask for a model task.
 */
MultisigFund.prototype.findFundTask = function(task) {
    for(var i=0; i<this.tasks.length; i++) {
        if (this.tasks[i].task === task) {
            return this.tasks[i];
        }
    }
}

/**
 * Order signatures for this multisig
 */
MultisigFund.prototype.organizeSignatures = function(hexSigs) {
    var signatures = [];
    var multisig = this.multisig;
    multisig.pubKeys.forEach(function(participant, i) {
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
MultisigFund.prototype.finishTransaction = function(spend, incomplete) {
    var self = this;
    var multisig = this.multisig;
    var script = Bitcoin.Script.fromHex(multisig.script);

    var finished = true;
    var builder = Bitcoin.TransactionBuilder.fromTransaction(spend.tx);
    spend.task.pending.forEach(function(input) {
        var hexSigs = self.organizeSignatures(input.signatures);

        if (Object.keys(input.signatures).length >= multisig.m || incomplete) {
            // convert inputs to signatures
            var sigs = hexSigs.map(function(sig) {return Bitcoin.ECSignature.fromDER(new Bitcoin.Buffer(sig, 'hex'));});
            // add signatures to the builder
            if (!builder.signatures[input.index]) {
                builder.signatures[input.index] = {hashType: Bitcoin.Transaction.SIGHASH_ALL, pubKeys: [], redeemScript: script, scriptType: "multisig", signatures: []};
            }
            builder.signatures[input.index].signatures = sigs;
        } else {
            finished = false;
        }
    });
    if (finished) {
        spend.tx = builder.buildIncomplete();
        spend.task.tx = spend.tx.toHex();
        return spend.tx;
    }
};

MultisigFund.prototype.importInputSignature = function(tx, sig, input, script) {
    var added;
    var txHashBuf = tx.hashForSignature(input.index, script, 1);
    this.multisig.pubKeys.forEach(function(pubKeyBytes, pIdx) {
        var pubKey = Bitcoin.ECPubKey.fromBytes(pubKeyBytes);
        if (pubKey.verify(txHashBuf, sig)) {
            input.signatures[pIdx] = sig.toDER().toString('hex');
            added = true;
        }
    });
    return added;
}

/**
 * Import a signature
 */
MultisigFund.prototype.importSignature = function(sigHex, spend) {
    var self = this;
    var added = false;
    var multisig = this.multisig;

    var sig;
    try {
       sig = Bitcoin.ECSignature.fromDER(new Bitcoin.Buffer(sigHex, 'hex'));
    } catch(e) {
       throw new Error('Malformed signature');
    }

    // Check where this signature goes
    var script = Bitcoin.Script.fromHex(multisig.script);
    spend.task.pending.forEach(function(input) {
        if (self.importInputSignature(spend.tx, sig, input, script)) {
            added = true;
        }
    });
    if (added) {
        this.finishTransaction(spend, true);
    }
    return added;
};


/**
 * Get a spend task from the given tx hash
 */
MultisigFund.prototype.getSpend = function(txHash) {
    for(var i=0; i<this.tasks.length; i++) {
        var spend = this.tasks[i];
        var hash = spend.tx.getId();
        if (hash === txHash) {
            return spend;
        }
    }
};

/**
 * Import a partial transaction into the fund
 */
MultisigFund.prototype.importTransaction = function(serializedTx) {
    var self = this;
    // import transaction here
    var identity = DarkWallet.getIdentity();

    // we import the tx
    var tx;
    try {
        tx = Bitcoin.Transaction.fromHex(serializedTx);
    } catch(e) {
        throw new Error('Malformed transaction');
    }
    // Find our inputs
    var inputs = this.getValidInputs(tx);

    if (inputs.length === 0) {
        throw new Error('Transaction is not for this multisig');
    }

    // Check if we have the tx in the identity store
    var found = false;
    var tasks = identity.tasks.getTasks('multisig');
    tasks.forEach(function(task) {
        if (Bitcoin.Transaction.fromHex(task.tx).getId() === tx.getId()) {
            found = task;
        }
    });

    var script = Bitcoin.Script.fromHex(this.multisig.script);

    // Now create the task
    var pending = found ? found.pending : [];
    // inputs format here comes from getValidInputs not directly from tx
    inputs.forEach(function(input) {
        if (!found) {
            var out = Bitcoin.bufferutils.reverse(input.outpoint.hash).toString('hex')+':'+input.outpoint.index;
            pending.push({output: out, address: input.address, index: input.index, signatures: {}, type: 'multisig'});
        }

        // Import signatures
        var txIn = tx.ins[input.index];
        if (txIn.script.chunks.length > 2) {
            txIn.script.chunks.slice(1,-1).forEach(function(sigBuf) {
                sigBuf = Bitcoin.ECSignature.parseScriptSignature(sigBuf).signature;
                self.importInputSignature(tx, sigBuf, pending[pending.length-1], script);
            });
        }
    });
    if (found) {
        var spends = this.tasks.filter(function(spend) {return spend.task === found})
        this.finishTransaction(spends[0], true);
        return spends[0];
    }
    else {
        var task = {tx: serializedTx, 'pending': pending, stealth: false, inPocket: this.multisig.address};
        var spend = {tx: tx, task: task};

        // add as task in the store
        identity.tasks.addTask('multisig', task);
        // Maybe should be imported here but now it's done on the angular controller..
        this.tasks.push(spend)
        return spend;
    }
};


/**
 * Continue signing after getting the password
 */
MultisigFund.prototype.signTransaction = function(password, spend, inputs) {
    var self = this;
    var identity = DarkWallet.getIdentity();
    var script = Bitcoin.Script.fromHex(this.multisig.script);

    var signed = false;

    var builder = Bitcoin.TransactionBuilder.fromTransaction(spend.tx);
    // find key
    this.participants.forEach(function(participant, pIdx) {
        if (participant.type === 'me') {
            var seq = participant.address.index;
            identity.wallet.getPrivateKey(seq, password, function(privKey) {
                inputs.forEach(function(input, i) {
                    builder.sign(input.index, privKey, script, 1);
                    var sig = builder.signatures[input.index].signatures.slice(-1)[0];
                    var hexSig = sig.toDER().toString('hex');
                    spend.task.pending[i].signatures[pIdx] = hexSig
                    // propagate transaction
                    DarkWallet.service.multisigTrack.sign(self.multisig, spend.tx, hexSig);
                    signed = true;
                });
                // TODO: may want to remove just this participant here
                spend.canSign = [];
                spend.task.signed = true;
            });
        }
    });
    if (signed) {
        this.finishTransaction(spend, true);
    }
    return signed;
};


/**
 * Sign a transaction with our keys
 */
MultisigFund.prototype.signTxForeign = function(foreignKey, spend) {
    var identity = DarkWallet.getIdentity();
    var multisig = this.multisig;

    var inputs = this.getValidInputs(spend.tx);
    if (inputs.length === 0) {
         // Shouldn't happen
         throw new Error('Transaction is not for this multisig');
    }

    var script = Bitcoin.Script.fromHex(this.multisig.script);
    var privKey = Bitcoin.ECKey.fromWIF(foreignKey);
    privKey.pub.compressed = true;
    var signingAddress = privKey.pub.getAddress(Bitcoin.networks[identity.wallet.network]).toString();

    var signed = false;
    var builder = Bitcoin.TransactionBuilder.fromTransaction(spend.tx);

    // Check each participant
    this.participants.forEach(function(participant, pIdx) {
        if (participant.type !== 'me') {     // can't be me if we're importing the key
            var pubKey = Bitcoin.ECPubKey.fromBytes(participant.pubKey, true);

            if (pubKey.getAddress(Bitcoin.networks[identity.wallet.network]).toString() === signingAddress) {
                // It's this position, so sign all inputs
                inputs.forEach(function(input, i) {
                    builder.sign(input.index, privKey, script, 1);
                    var sig = builder.signatures[input.index].signatures.slice(-1)[0];
                    var hexSig = sig.toDER().toString('hex');
                    spend.task.pending[i].signatures[pIdx] = hexSig;
                    DarkWallet.service.multisigTrack.sign(multisig, spend.tx, hexSig);
                    signed = true;
                });
            }
        }
    });
    if (signed) {
        this.finishTransaction(spend, true);
    }
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
        var inputs = identity.tx.forAddress(walletAddress, tx);
        return inputs;
    }
    return [];
};

return MultisigFund;

});
