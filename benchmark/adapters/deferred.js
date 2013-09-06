var deferred = require('deferred');

exports.pending = function () {
    var d = deferred();

    return {
        promise: d.promise,
        fulfill: d.resolve,
        reject: function(reason) {
            d.resolve(new Error(reason));
        }
    };
};

exports.fulfilled = deferred;
exports.rejected = function(reason) {
    return deferred(new Error(reason));
};

exports.map = deferred.map;
exports.reduce = deferred.reduce;
