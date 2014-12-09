/*
 * @fileOverview CryptoService Service managing crypto operations on a background thread.
 */
'use strict';

define(['backend/port'], function(Port) {

  function CryptoService(core) {
    var self = this;
    this.name = 'crypto';

    // Worker for processing stealth
    var worker;

    /**
     * Some variables for stealth processing
     */
    var jobIndex = 0;
    var jobs = {};

    this.post = function(data, callback) {
        jobs[jobIndex] = callback;
        data.id = jobIndex;
        worker.postMessage(data);
        jobIndex += 1;
    };

    /**
     * Initialize the stealth worker for an identity
     */
    this.initWorker = function(identity) {
        if (worker) {
            // kill the previous worker
            worker.terminate();
            jobs = {};
        }
        worker = new Worker('/src/js/backend/workers/crypto.js');
        worker.onmessage = function(oEvent) {
            if (jobs.hasOwnProperty(oEvent.data.id)) {
                var job = jobs[oEvent.data.id];
                if (oEvent.data.error) {
                    job(oEvent.data.error);
                } else {
                    job(null, oEvent.data.payload);
                }
                delete jobs[oEvent.data.id];
            } else {
                console.log("[crypto] Invalid message from the worker!");
            }
        };
    };
    this.initWorker();
  }
  return CryptoService;
});

