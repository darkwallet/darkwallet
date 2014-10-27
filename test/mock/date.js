/**
 * Date mock object that works as if current time is fixed at 
 * Sun Oct 12 2014 10:12:54 GMT+0200 (CEST)
 */

'use strict';

define([], function() {

    var realDate;
    function mockDate(val) {
        if (!val) {
            this.date = new realDate(1413101574805);
        } else {
            this.date = new realDate(val);
        }
    }
    mockDate.hook = function() {
        if (realDate) {
            throw Error('Hook date called two times!');
        }
        realDate = window.Date;
        window.Date = mockDate;
    }
    mockDate.restore = function() {
        window.Date = realDate;
        realDate = undefined;
    }
    mockDate.prototype.setDate = function(val) {
        return this.date.setDate(val);
    }
    mockDate.prototype.toLocaleDateString = function() {
        return this.date.toLocaleDateString();
    }
    mockDate.prototype.valueOf = function() {
        return this.date.valueOf();
    }
    mockDate.prototype.getDate = function() {
        return this.date.getDate();
    }
    mockDate.prototype.getDay = function() {
        return this.date.getDay();
    }
    mockDate.prototype.getMonth = function() {
        return this.date.getMonth();
    }
    mockDate.prototype.getFullYear = function() {
        return this.date.getFullYear();
    }
    mockDate.prototype.getHours = function() {
        return this.date.getHours();
    }
    mockDate.prototype.getMinutes = function() {
        return this.date.getMinutes();
    }
    mockDate.prototype.getTime = function() {
        return this.date.getTime();
    }

    return mockDate;

});
