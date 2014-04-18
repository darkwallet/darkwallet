'use strict';
define(function() {
    var mock = {
        mock: function(obj) {
            for(var i in obj) {
                mock[i] = obj[i];
            }
        }
    };
    return mock;
});