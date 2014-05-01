/*
 * @fileOverview Background service running for the wallet
 */
'use strict';

define(['model/keyring', 'backend/port', 'dwutil/currencyformat', 'dwutil/tasks/transaction', 'bitcoinjs-lib', 'util/btc', 'sjcl'],
function(IdentityKeyRing, Port, CurrencyFormatting, TransactionTasks, Bitcoin, BtcUtils) {

  function WalletService(core) {
    var keyRing = new IdentityKeyRing();
    var self = this;
    this.name = 'wallet';
    var heightTimeout;
    var lastTimestamp;

    // Some scope variables
    var currentIdentity = false;

    this.currentHeight = 0;

    // Wallet port
    Port.listen('wallet', function() {
      }, function(port) {
          // Client connected
          if (currentIdentity && keyRing.identities.hasOwnProperty(currentIdentity)) {
              port.postMessage({'type': 'ready', 'identity': currentIdentity});
          }
      }, function(port) {
          // Client disconnected
    });

    /***************************************
    /* Identities
     */

    var startIdentity = function(identity, callback) {
        if (heightTimeout) {
            clearInterval(heightTimeout);
            heightTimeout = false;
        }
        currentIdentity = identity.name;

        //Load up tasks
        core.service.badge.setItems(identity);

        // Inform gui and other services
        identity.history.update = function() { Port.post('gui', {name: 'update'}); };
        if (lastTimestamp) {
            BtcUtils.setLastTimestamp(lastTimestamp.height, lastTimestamp.timestamp);
            Port.post('gui', {type: 'timestamps', height: lastTimestamp.height, timestamp: lastTimestamp.timestamp});
        }
        self.blockDiff = BtcUtils.blockDiff;

        Port.post('wallet', {'type': 'ready', 'identity': identity.name});
        Port.post('wallet', {'type': 'loaded', 'identity': identity.name});

        callback ? callback(identity) : null;
    }

    this.createIdentity = function(name, network, secret, password, callback) {
        console.log("[wallet] Create identity", name);
        if (currentIdentity) {
            Port.post('wallet', {'type': 'closing', 'identity': currentIdentity});
        }
        var identity = keyRing.createIdentity(name, network, secret, password);
        startIdentity(identity, callback);
    }

    this.reloadIdentity = function(store, callback) {
        if (store.name != currentIdentity) {
            throw Error("This is not the running identity!");
        }
        Port.post('wallet', {'type': 'closing', 'identity': currentIdentity});
        keyRing.close(store.name);
        keyRing.save(store.name, store, function() {
            keyRing.get(store.name, function(identity) {
                startIdentity(identity, callback);
            });
        });
    }

    this.loadIdentity = function(idx, callback) {
        var name = keyRing.availableIdentities[idx];
        if (currentIdentity != name) {
            Port.post('wallet', {'type': 'closing', 'identity': currentIdentity});
            console.log("[wallet] Load identity", name);
            keyRing.get(name, function(identity) {
                startIdentity(identity, callback);
            });
        }
    };

    // Get an identity from the keyring
    this.getIdentity = function(idx) {
        if (idx === null || idx === undefined) {
            return self.getCurrentIdentity();
        }
        var name = keyRing.availableIdentities[idx];
        currentIdentity = name;
        return keyRing.identities[name];
    };

    this.getCurrentIdentity = function() {
        return keyRing.identities[currentIdentity];
    };

    // Notify frontend of history row updates
    var notifyRow = function(walletAddress, row, height) {
        var title;
        var value = row.total;

        if (value > 0) {
            if (height) {
                title = "Received";
            } else {
                title = "Receiving (unconfirmed)";
            }
        } else {
            if (height) {
                title = "Sending";
            } else {
                title = "Sending (unconfirmed)";
            }
        }
        TransactionTasks.processRow(value, row, height);
        core.service.badge.setItems();
        var formattedValue = CurrencyFormatting.format(value);

        // Port the the os notification service
        core.service.notifier.post(title, formattedValue);

        // Post the balance update to the gui so it can be updated
        var pocketId = core.getIdentity().wallet.pockets.getAddressPocketId(walletAddress);
        Port.post('gui', {type: 'balance', pocketId: pocketId});
    };

    // Callback for when an address was updated
    var onAddressUpdate = function(walletAddress, addressUpdate) {
        var identity = self.getCurrentIdentity();

        // Get variables from the update
        var height = addressUpdate.height;
        var tx = addressUpdate.tx;
        // var block_hash = addressUpdate.block_hash;
        var address = addressUpdate.address;

        if (addressUpdate.address != walletAddress.address) {
            // not for us..
            console.log("Invalid address update!!!!!");
            return;
        }

        // Process
        var row = identity.wallet.processTx(walletAddress, tx, height);

        // Show a notification for incoming transactions
        if (row) {
            notifyRow(walletAddress, row, height);
        }
    }

    /***************************************
    /* History and address subscription
     */
    function historyFetched(err, walletAddress, history) {
        if (err) {
            core.servicesStatus.syncing -= 1;
            core.servicesStatus.obelisk = 'error';
            console.log("[wallet] Error fetching history for", walletAddress.address);
            return;
        }
        core.servicesStatus.obelisk = 'ok';
        var client = core.getClient();
        var identity = self.getCurrentIdentity();

        // pass to the wallet to process outputs
        identity.wallet.processHistory(walletAddress, history);

        // start filling history
        identity.history.fillHistory(walletAddress, history);

        if (TransactionTasks.processHistory(history, self.currentHeight)) {
            // some task was updated
        }

        // now subscribe the address for notifications
        client.subscribe(walletAddress.address, function(err, res) {
            core.servicesStatus.syncing -= 1;
            // fill history after subscribing to ensure we got all histories already (for now).
            var pocketId = identity.wallet.pockets.getAddressPocketId(walletAddress);
            Port.post('gui', {type: 'balance', pocketId: pocketId});
        }, function(addressUpdate) {
            onAddressUpdate(walletAddress, addressUpdate);
        });
    }

    // Start up history for an address
    this.initAddress = function(walletAddress) {
        var client = core.getClient();
        if (!client) {
            // TODO manage this case better
            console.log("trying to init address but not connected yet!... skipping :P");
            return;
        }
        var identity = self.getCurrentIdentity();

        // Load history cache
        if (walletAddress.history) {
            identity.history.fillHistory(walletAddress, walletAddress.history);
        }
        if (!core.servicesStatus.syncing) {
            core.servicesStatus.syncing = 0;
        }
        core.servicesStatus.syncing += 1;
        // Now fetch history
        client.fetch_history(walletAddress.address, 0 /*walletAddress.height*/, function(err, res) { historyFetched(err, walletAddress, res); });
    };

    // Handle a block header arriving from obelisk
    function handleBlockHeader(height, headerHex) {
        var header = BtcUtils.decodeBlockHeader(headerHex);

        BtcUtils.setLastTimestamp(height, header.timestamp);
        self.blockDiff = BtcUtils.blockDiff;
        lastTimestamp = {height: height, timestamp: header.timestamp};
        Port.post('gui', {type: 'timestamps', value: lastTimestamp});
    }

    // Handle height arriving from obelisk
    function handleHeight(err, height) {
        if (height != self.currentHeight) {
            self.currentHeight = height;
            console.log("[wallet] height fetched", height);
            TransactionTasks.processHeight(height);
            core.service.badge.setItems();
            core.servicesStatus.syncing += 1;
            Port.post('wallet', {type: 'height', value: height});
            Port.post('gui', {type: 'height', value: height});
            var client = core.getClient();
            client.fetch_block_header(height, function(err, data) {
                core.servicesStatus.syncing -= 1;
                if (!err) {
                    handleBlockHeader(height, data)
                } else {
                   console.log("[wallet] error fetching block header", err, height)
                }
            });
            self.fetchStealth(height);
        }
    }

    this.fetchHeight = function() {
        if (heightTimeout) {
            console.log("[wallet] warning, height timeout launched but still active!");
            clearInterval(heightTimeout);
        }

        var client = core.getClient();
        client.fetch_last_height(handleHeight);

        // Run again in one minute to get last height (gateway doesn't give this yet..)
        heightTimeout = setInterval(function() {
            var client = core.getClient();
            if (client && client.connected) {
                client.fetch_last_height(handleHeight);
            }
        }, 60000);
    }


    this.handleInitialConnect = function() {
        console.log("[wallet] initial connect");
        var identity = self.getCurrentIdentity();
        core.servicesStatus.syncing = 0;

        var client = core.getClient();

        self.fetchHeight();

        // get balance for addresses
        Object.keys(identity.wallet.pubKeys).forEach(function(pubKeyIndex) {
            var walletAddress = identity.wallet.pubKeys[pubKeyIndex];
            if (walletAddress.index.length > 1) {
                self.initAddress(walletAddress);
            }
        });
    };

    this.getKeyRing = function() {
        return keyRing;
    };

    /*
     * Send a transaction into the mixer
     */
    this.mixTransaction = function(newTx, metadata, password, callback) {
        var identity = self.getCurrentIdentity();
        var task = {tx: newTx.serializeHex(),
                    state: 'announce',
                    total: metadata.total,
                    fee: metadata.fee,
                    recipients: metadata.recipients,
                    change: metadata.change,
                    timeout: 60, // timeout in secs
                    start: Date.now()/1000,
                    myamount: metadata.myamount};

        // Gather private keys for this task
        var privKeys = {};
        metadata.utxo.forEach(function(utxo) {
            var address = identity.wallet.getWalletAddress(utxo.address);
            if (address && !privKeys.hasOwnProperty(address.index)) {
                identity.wallet.getPrivateKey(address.index, password, function(privKey) {
                    privKeys[address.index] = privKey.toBytes().slice(0);
                });
            } else if (!address) {
                console.log("[wallet] No private keys for", address);
            }
        });

        // Store privkeys in the task encrypted for the session
        var safe = core.service.safe;
        var txHash = Bitcoin.convert.bytesToString(newTx.getHash());
        var taskPassword = safe.set('send', txHash, password);
        task.privKeys = sjcl.encrypt(taskPassword, JSON.stringify(privKeys));

        // Add the task to model
        identity.tasks.addTask('mixer', task);

        // Now start the task in the mixer service
        var mixerService = core.service.mixer;
        mixerService.startTask(task);

        // Sign the transaction to have a fallback in case the mixing fails

        this.signTransaction(newTx.clone(), metadata, password, function(err, signed) {
            if (!err && signed.type == 'signed') {
                task.fallback = signed.tx.serializeHex();
                // Callback for calling process
                callback(null, {task: task, tx: newTx, type: 'mixer', privKeys: privKeys});
            } else {
                callback(err);
            }
        });
    };

    /*
     * Fetch stealth
     */
    this.fetchStealth = function(height, cb) {
        var identity = core.getIdentity();

        // Callback
        var onStealthReceived = function(error, results) {
            if (error) {
                console.log("[wallet] Error retrieving stealth data", error);
                cb ? cb(error, null) : null;
                return;
            }
            console.log("[wallet] Processing stealth");
            // process stealth information
            identity.wallet.processStealth(results, function(addresses) {
                console.log("[wallet] Stealth detected " + addresses.length + ' addresses from ' + results.length + ' results');

                // Everything went all right, set lastStealth and initialize on the network
                identity.wallet.store.set('lastStealth', height);
                identity.wallet.store.save();

                // Initialize addresses on the wallet
                addresses.forEach(self.initAddress);

                // Run the callback with results
                cb ? cb(null, addresses) : null;
            });
        }

        // Request fetching the stealth using the client
        var client = core.getClient();
        var fromHeight = identity.wallet.store.get('lastStealth') || 0;
        if (height > fromHeight) {
            console.log("Requesting stealth from block " + fromHeight + " for " + height);
            client.fetch_stealth([0,0], onStealthReceived, fromHeight);
        }
    };

    /*
     * Perform fallback operations for a failed task
     */
    this.sendFallback = function(type, task) {
        if (type == 'mixer') {
            if (!task.fallback) {
                console.log("no fallback for this task!!", task);
                return;
            }
            var tx = new Bitcoin.Transaction(task.fallback);
            task.state = 'finished';
            task.progress = 100;

            var hash = Bitcoin.convert.bytesToHex(tx.getHash());
            var spendTask = TransactionTasks.processSpend(hash, task.total, task.recipients);
            core.service.badge.setItems(self.getCurrentIdentity());
            self.broadcastTx(tx, spendTask, function(err, data) {console.log(err,data)});
        } else {
            console.log("[wallet] Calling fallback for unknown type", task);
        }
    }

    /*
     * Sign a transaction, then broadcast or add task to gather sigs
     */
    this.signTransaction = function(newTx, metadata, password, callback, broadcast) {
        var identity = self.getCurrentIdentity();
        // Otherwise just sign and lets go
        identity.wallet.signTransaction(newTx, metadata.utxo, password, function(err, pending) {
            if (err) {
                // There was some error signing the transaction
                callback(err);
            } else if (pending.length) {
                // If pending signatures add task and callback with 2nd parameter
                var task = {tx: newTx.serializeHex(), 'pending': pending, stealth: metadata.stealth};
                identity.tasks.addTask('multisig', task);
                callback(null, {task: task, tx: newTx, type: 'signatures'});
            } else if (broadcast) {
                // Broadcast and add task
                var txHash = Bitcoin.convert.bytesToHex(newTx.getHash());
                var task = TransactionTasks.processSpend(txHash, metadata.total, metadata.recipients);
                core.service.badge.setItems(identity);
                self.broadcastTx(newTx, task, callback);
            } else {
                // Return the signed tx
                callback(null, {tx: newTx, type: 'signed'});
            }
        });
    };

    /*
     * Broadcast the given transaction
     */
     this.broadcastTx = function(newTx, task, callback) {
         // Broadcasting
         console.log("send tx", newTx);
         console.log("send tx", newTx.serializeHex());
         var notifyTx = function(error, count) {
             if (error) {
                 console.log("Error sending tx: " + error);
                 callback({data: error, text: "Error sending tx"});
             } else {
                 TransactionTasks.processRadar(task, count);

                 // notify gui about radar updates
                 Port.post('gui', {type: 'radar', count: count});

                 callback(null, {radar: count, type: 'radar'});
                 console.log("tx radar: " + count);
             }
         };
         core.getClient().broadcast_transaction(newTx.serializeHex(), notifyTx);
     };
  }
  return WalletService;
});

