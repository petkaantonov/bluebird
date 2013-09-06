var q = require('q');

exports.pending = function () {
    var deferred = q.defer();

    return {
        promise: deferred.promise,
        fulfill: deferred.resolve,
        reject: deferred.reject
    };
};

exports.fulfilled = q.resolve;
exports.rejected = q.reject;
