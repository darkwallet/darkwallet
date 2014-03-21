/*
 * @fileOverview Multisig funds
 */

define(function() {

/**
 * Multisig class, holds multisig funds.
 * @param {Object} store Store for the object.
 * @param {Object} identity Parent identity for the object
 * @constructor
 */
function Multisig(store, identity) {
    this.funds = store.init('funds', []);
    this.identity = identity;
    this.store = store;
}

/**
 * Add a fund to the store
 * @param {Object} fund An object holding the fund properties.
 */
Multisig.prototype.addFund = function(fund) {
    if (!fund.name) {
        throw Error('fund has no name!');
    }
    this.funds.push(fund);
    this.store.save();
}

return Multisig;
});
