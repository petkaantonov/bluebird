"use strict";
module.exports = function(Promise) {

Promise.lift = function ( fn ) {
    var that = this;
    return function() {
        var $_len = arguments.length;
        var args = new Array($_len+1);
        for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
        args[$_len] = fn;
        return Promise.join.apply( that, args );
    };
};

};
