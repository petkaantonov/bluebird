var timers = require('./timers-ctx');

var fakemaker = require('./fakemaker');

var f = {};
f.dummy = function dummy(n) {
    return function dummy_n() {
        var cb = arguments[n - 1],
            ctx = arguments[n];
        //console.log(cb, ctx);

        timers.setTimeout(cb, ctx, global.asyncTime || 100);
    }
}

// A throwing callback function
f.dummyt = function dummyt(n) {
    return function dummy_throwing_n() {
        var cb = arguments[n - 1],
            ctx = arguments[n];
        if (global.testThrow) 
            throw(new Error("Exception happened"));
        setTimeout(function throwTimeout() {
            if (global.testThrowAsync) {
                throw(new Error("Exception happened"));
            } else if (global.testError) {
                return cb.call(ctx, new Error("Error happened"));
            }
            else cb.call(ctx);
        }, global.asyncTime || 100);
    }
}




fakemaker(f.dummy, f.dummyt, function wrap_identity(f) { return f; });


