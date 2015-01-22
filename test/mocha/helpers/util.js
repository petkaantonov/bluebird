var assert = require("assert");
module.exports = {
    processError: function(fn, done) {
        if (typeof process !== "undefined" && typeof process.version === "string") {
            var listeners = process.listeners("uncaughtException");
            process.removeAllListeners("uncaughtException");
            process.on("uncaughtException", function(e) {
                var err;
                var ret;
                try {
                    ret = fn(e);
                } catch (e) {
                    err = e;
                }
                if (!err && ret === false) return;
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
    },

    isSubset: function(subset, superset) {
        var i, subsetLen;

        subsetLen = subset.length;

        if (subsetLen > superset.length) {
            return false;
        }

        for(i = 0; i<subsetLen; i++) {
            if(!module.exports.contains(superset, subset[i])) {
                return false;
            }
        }

        return true;
    },

    contains: function(arr, result) {
        return arr.indexOf(result) > -1;
    },

    fakeResolved: function(val) {
        return {
            then: function(callback) {
                return fakeResolved(callback ? callback(val) : val);
            }
        };
    },

    fakeRejected: function(reason) {
        return {
            then: function(callback, errback) {
                return errback ? fakeResolved(errback(reason)) : fakeRejected(reason);
            }
        };
    },

    assertFulfilled: function(p, v) {
        assert.strictEqual(p.value(), v);
    },

    assertRejected: function(p, v) {
        assert.strictEqual(p.error(), v);
    },

    isNodeJS: typeof process !== "undefined" && typeof process.execPath === "string"
};
