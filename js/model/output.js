'use strict';

define([], function() {

/**
 * Output properties and data.
 * @param {Object} 
 * @param {String} outId Output id ("hash:index")
 * @param {Number} value Value for this output
 * @param {String} address Output address
 * @constructor
 */
function Output(store, outId, value, address) {
    this.store = store;
    if (outId) {
        this.store[0] = outId;
        this.store[1] = value;
        this.store[2] = address;
    }
    // [outId, value, address, height, spend, counted, spendpending, spendheight, stealth]
}

/**
 * Receive id for the output ("hash:index")
 */
Object.defineProperty(Output.prototype, 'receive', {
    get: function() { return this.store[0]; }
});

/**
 * Value for the output (Number)
 */
Object.defineProperty(Output.prototype, 'value', {
    get: function() { return this.store[1]; }
});

/**
 * Address owning the output (String)
 */
Object.defineProperty(Output.prototype, 'address', {
    get: function() { return this.store[2]; }
});

/**
 * Height when the output was confirmed (Number)
 */
Object.defineProperty(Output.prototype, 'height', {
    get: function() { return this.store[3]; },
    set: function(val) { this.store[3] = val; }
});

/**
 * id for the output spend ("hash:index")
 */
Object.defineProperty(Output.prototype, 'spend', {
    get: function() { return this.store[4]; },
    set: function(val) { this.store[4] = val; }
});

/**
 * Whether this output has been counted into the address balance (Boolean)
 */
Object.defineProperty(Output.prototype, 'counted', {
    get: function() { return this.store[5]; },
    set: function(val) { this.store[5] = val; }
});

/**
 * Whether this output is pending discount from its address (Boolean)
 */
Object.defineProperty(Output.prototype, 'spendpending', {
    get: function() { return this.store[6]; },
    set: function(val) { this.store[6] = val; }
});

/**
 * Height where this output was spent (Number)
 */
Object.defineProperty(Output.prototype, 'spendheight', {
    get: function() { return this.store[7]; },
    set: function(val) { this.store[7] = val; }
});

/**
 * Is this output stealth? (Boolean)
 */
Object.defineProperty(Output.prototype, 'stealth', {
    get: function() { return this.store[8]; },
    set: function(val) { this.store[8] = val; }
});

return Output;
});
