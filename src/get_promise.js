"use strict";
var P;

module.exports = {
    set: function( Promise ) {
        P = Promise;
    },
    get: function() {
        return P;
    }
};
