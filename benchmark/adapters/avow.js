var avow = require("avow");

var tmp = {fulfill: void 0, reject: void 0}
function resolver( resolve, reject ) {
    tmp.fulfill = resolve;
    tmp.reject = reject;
}

exports.pending = function() {
    //Avoid creating a closure
    var promise = avow( resolver );
    var fulfill = tmp.fulfill;
    var reject = tmp.reject;
    return {
        promise: promise,
        fulfill: fulfill,
        reject: reject
    };
};

exports.fulfilled = avow.lift;
exports.rejected = avow.reject;