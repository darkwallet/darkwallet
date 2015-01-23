/*
 * @fileOverview StealthService Service managing fetching stealth and processing in an internal worker
 */
'use strict';

define(['backend/port'], function(Port) {

  function StealthService(core) {
    var self = this;
    this.name = 'stealth';

    // Worker for processing stealth
    var stealthWorker;

    /**
     * Some variables for stealth processing
     */
    var stealthJobIndex = 0;
    var stealthJobs = {};
    var lastStealthRequested = 0;
    var queue = [];
    var workerStarted = false;
    var tries = 0;
    /**
     * Initialize the stealth worker for an identity
     */
    this.initWorker = function(identity) {
        if (stealthWorker) {
            // kill the previous worker
            stealthWorker.terminate();
            queue = [];
            workerStarted = false;
            stealthJobs = {};
        }
        lastStealthRequested = identity.wallet.store.get('lastStealth');
        stealthWorker = new Worker('/src/js/backend/workers/stealth.js');
        stealthWorker.onmessage = function(oEvent) {
            if (oEvent.data.type == 'stealth') {
                onStealthResults(oEvent.data.id, oEvent.data.matches, oEvent.data.height);
            } else if (oEvent.data.type == 'init') {
                console.log("[stealth] worker started");
                workerStarted = true;
                queue.forEach(function(msg) {
                    stealthWorker.postMessage(msg);
                });
                queue = [];
            } else {
                console.log("[stealth] Invalid message from the worker!");
            }
        };
        stealthWorker.onerror = function(error) {
            if (error.message.indexOf("importScript") > -1) {
                console.log("[stealth] worker failed importing, retrying...");
                if (tries < 5) {
                    tries += 1;
                    setTimeout(function() {self.initWorker(identity)}, 500);
                }
            } else {
                console.log("[stealth] worker error!")
                console.log(error)
            }
        };

    };

    /**
     * Stealth results coming from the worker
     */
    var onStealthResults = function(id, matches, height) {
        var identity = core.getIdentity();
        var job = stealthJobs[id];

        console.log("[stealth] Detected " + matches.length + ' addresses from ' + job.nResults + ' results');

        // Check all matches and initialize wallet addresses
        var addresses = [];
        matches.forEach(function(match) {
            addresses.push(identity.wallet.processStealthMatch(match.pocketIndex, match.ephemKey, match.pubKey, match.address, match.quirk));
        });

        // Everything went all right, save lastStealth and initialize on the network
        identity.wallet.store.set('lastStealth', height);
        identity.wallet.store.save();

        // Initialize addresses on the network
        addresses.forEach(function(address) {
            core.service.wallet.initAddress(address);
            Port.post('wallet', {'type': 'address', 'address': address.address, 'index': address.index});
        });

        // Run the callback with results
        job.cb ? job.cb(null, addresses) : null;

        // Delete the job
        delete stealthJobs[id];
    };

    /*
     * Fetch stealth
     */
    this.fetch = function(height, cb) {
        var identity = core.getIdentity();
        var fetchJobId;

        // If requesting for height 0 force last requested to 0 too and
        // restart worker to make sure there is no pending work.
        if (height === 0) {
            tries = 0;
            lastStealthRequested = 0;
            identity.store.set('lastStealth', 0);
            self.initWorker(identity);

            // request for current height
            height = core.service.wallet.currentHeight;
        }

        // Results incoming, send them to worker
        var onStealthReceived = function(error, results) {
            if (!stealthJobs[fetchJobId]) {
                console.log("[stealth] Not processing cancelled job");
                return;
            }
            // clear the fetch job
            delete stealthJobs[fetchJobId];
            if (error) {
                console.log("[stealth] Error retrieving data", error);
                cb ? cb(error, null) : null;
                return;
            }
            console.log("[stealth] Processing " + results.length);

            // prepare a requests for the worker
            identity.wallet.pockets.hdPockets.forEach(function(pocket, i) {
                if (pocket) {
                    // From version five pocket id === main pocket branch id
                    var branchId = (identity.store.get('version') > 4) ? i : i*2;
                    var request = {id: stealthJobIndex,
                                   type: 'stealth',
                                   pocketIndex: i,
                                   stealthArray: results,
                                   scanKey: identity.wallet.getScanKey(branchId).toBytes(),
                                   spendKey: identity.wallet.getAddress([branchId]).pubKey,
                                   versions: identity.wallet.versions,
                                   oldMode: identity.store.get('version') < 5,
                                   height: height};

                    // Save information about the job here so we can keep track of it
                    stealthJobs[stealthJobIndex] = {type: 'process', cb: cb, nResults: results.length}

                    stealthJobIndex += 1;
                    if (workerStarted) {
                        stealthWorker.postMessage(request);
                    } else {
                        queue.push(request);
                    }
                }
            });
        }

        // Request fetching the stealth using the client
        var client = core.getClient();
        var fromHeight = lastStealthRequested || 0;
        if (height > fromHeight) {
            console.log("[stealth] Requesting from block " + fromHeight + " for " + height);
            lastStealthRequested = height;
            client.fetch_stealth([0,0], onStealthReceived, fromHeight);
            // register the id so we can check later its not cancelled
            fetchJobId = stealthJobIndex;
            stealthJobs[stealthJobIndex] = {type: 'request'};
            stealthJobIndex += 1;
        }
    };
  }
  return StealthService;
});

