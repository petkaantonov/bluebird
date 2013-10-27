var Promise = require('../../js/zalgo/bluebird.js');


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
exports.map = Promise.map;
exports.reduce = Promise.reduce;
