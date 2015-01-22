module.exports = function(fn, done) {
    if (typeof process !== "undefined" && typeof process.version === "string") {
        var listeners = process.listeners("uncaughtException");
        process.removeAllListeners("uncaughtException");
        process.on("uncaughtException", function(e) {
            var err;
            try {
                fn(e);
            } catch (e) {
                err = e;
            }
            process.removeAllListeners("uncaughtException");
            listeners.forEach(function(listener) {
                process.on("uncaughtException", listener);
            });
            setTimeout(function() {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            }, 1);

        });
    } else {
        setTimeout(function() {
            done();
        }, 1);
    }
};
