var Promise = require('../../js/promise_sync.js');


exports.pending = function() {
    var a = Promise.pending();
    return {
        promise: a.promise,
        fulfill: a.fulfill,
        reject: a.reject
    }
};

exports.createNormal = function() {
    return Promise.pending();
};

exports.fulfilled = Promise.fulfilled;
exports.rejected = Promise.rejected;