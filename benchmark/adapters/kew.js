var q = require('kew');

exports.pending = function () {
    var deferred = q.defer();

    return {
        promise: deferred,
        fulfill: deferred.resolve,
        reject: deferred.reject,
    };
};

exports.fulfilled = q.resolve;
exports.rejected = q.reject;
exports.map = q.all;
