"use strict";
module.exports = (function(){
    var AssertionError = (function() {
        function AssertionError(a) {
            this.constructor$(a);
            this.message = a;
            this.name = "AssertionError";
        }
        AssertionError.prototype = new Error();
        AssertionError.prototype.constructor = AssertionError;
        AssertionError.prototype.constructor$ = Error;
        return AssertionError;
    })();

    return function assert(boolExpr, message) {
        if (boolExpr === true) return;

        var ret = new AssertionError(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(ret, assert);
        }
        if (console && console.error) {
            console.error(ret.stack + "");
        }
        throw ret;

    };
})();
