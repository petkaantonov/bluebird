var rsvp = require("rsvp");

var tmp = {fulfill: void 0, reject: void 0}
function resolver( resolve, reject ) {
    tmp.fulfill = resolve;
    tmp.reject = reject;
}

exports.pending = function() {
    //Avoid creating a closure
    var promise = new rsvp.Promise( resolver );
    var fulfill = tmp.fulfill;
    var reject = tmp.reject;
    return {
        promise: promise,
        fulfill: fulfill,
        reject: reject
    };
};

exports.fulfilled = function( v ) {
    var r = exports.pending();
    r.fulfill( v );
    return r.promise;
};

exports.rejected = function( v ) {
    var r = exports.pending();
    r.reject( v );
    return r.promise;
};