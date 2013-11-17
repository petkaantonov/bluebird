// A typical node callback function
// with the callback at the Nth position
exports.dummy = function dummy(n) {
    return function dummy_n() {
        var cb = arguments[n - 1];
        if (global.asyncTime)
            setTimeout(cb, global.asyncTime || 100);
        else
            process.nextTick(cb);
    }
}

// A throwing callback function
exports.dummyt = function dummyt(n) {
    return function dummy_throwing_n() {
        var cb = arguments[n - 1];
        if (global.testThrow) 
            throw(new Error("Exception happened"));
        setTimeout(function throwTimeout() {
            if (global.testThrowAsync) {
                throw(new Error("Exception happened"));
            } else if (global.testError) {
                return cb(new Error("Error happened"));
            }
            else cb();
        }, global.asyncTime || 100);
    }
}


