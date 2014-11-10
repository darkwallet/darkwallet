'use strict';

define(['bitcoinjs-lib', 'util/btc'], function(Bitcoin, BtcUtils) {

function Output(store, hash, value, address) {
    this.store = store;
    if (hash) {
        this.store[0] = hash;
        this.store[1] = value;
        this.store[2] = address;
    }
    // [outId, value, address, height, spend, counted, spendpending, spendheight, stealth]
}

Object.defineProperty(Output.prototype, 'receive', {
    get: function() { return this.store[0]; }
});
Object.defineProperty(Output.prototype, 'value', {
    get: function() { return this.store[1]; }
});
Object.defineProperty(Output.prototype, 'address', {
    get: function() { return this.store[2]; }
});
Object.defineProperty(Output.prototype, 'height', {
    get: function() { return this.store[3]; },
    set: function(val) { this.store[3] = val; }
});
Object.defineProperty(Output.prototype, 'spend', {
    get: function() { return this.store[4]; },
    set: function(val) { this.store[4] = val; }
});
Object.defineProperty(Output.prototype, 'counted', {
    get: function() { return this.store[5]; },
    set: function(val) { this.store[5] = val; }
});
Object.defineProperty(Output.prototype, 'spendpending', {
    get: function() { return this.store[6]; },
    set: function(val) { this.store[6] = val; }
});
Object.defineProperty(Output.prototype, 'spendheight', {
    get: function() { return this.store[7]; },
    set: function(val) { this.store[7] = val; }
});
Object.defineProperty(Output.prototype, 'stealth', {
    get: function() { return this.store[8]; },
    set: function(val) { this.store[8] = val; }
});

return Output;
});
