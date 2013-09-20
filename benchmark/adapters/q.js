var q = require('q');

q.longStackTraces = false;
q.longStackSupport = false;
q.onerror = function(){};


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
