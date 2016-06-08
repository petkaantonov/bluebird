

if (global.useQ)
    var lifter = require('q').denodeify;
else if (global.useBluebird)
    //Currently promisifies only Node style callbacks
    var lifter = require('../../js/release/bluebird.js').promisify;
else if (global.useKew) {
    var q = require('kew');
    var slicer = [].slice;
    var lifter = function lifter(nodefn) {
        return function() {
            var p = q.defer();
            arguments[arguments.length++] = function(err, res) {
                if (err) p.reject(err);
                else p.resolve(res)
            };
            try {
                nodefn.apply(this, arguments);
            }
            catch (e) {
                p.reject(e);
            }
            return p;
        }
    }
}
else if(global.useLie) {
    var Lie = require('lie');
    var lifter = function(nodefn) {
        return function() {
            var self = this;
            var l = arguments.length;
            var args = new Array(l + 1);
            for (var i = 0; i < l; ++i) {
                args[i] = arguments[i];
            }
            return new Lie(function(resolve, reject) {
                args[l] = function(err, val) {
                    if (err) reject(err);
                    else resolve(val);
                };
                nodefn.apply(self, args);
            });
        };
    };
}
else if(global.useThenPromise) {
    var lifter = require("promise").denodeify;
}
else if( global.useRSVP ) {
    var lifter = require("rsvp").denodeify;
}
else if( global.useDeferred) {
    var lifter = require("deferred").promisify;
}
else if( global.useDavy) {
    var lifter = require("davy").wrap;
}
else if (global.useNative) {
    try {
        if (Promise.race.toString() !== 'function race() { [native code] }')
            throw 0;
    } catch (e) {
        throw new Error("No ES6 promises available");
    }
    var lifter = function(nodefn) {
        return function() {
            var self = this;
            var l = arguments.length;
            var args = new Array(l + 1);
            for (var i = 0; i < l; ++i) {
                args[i] = arguments[i];
            }
            return new Promise(function(resolve, reject) {
                args[l] = function(err, val) {
                    if (err) reject(err);
                    else resolve(val);
                };
                nodefn.apply(self, args);
            });
        };
    };
}
else {
    var lifter = require('when/node').lift;
}

var f = require('./dummy');

var makefakes = require('./fakemaker');

// A function taking n values or promises and returning
// a promise
function dummyP(n) {
    return lifter(f.dummy(n));
}

// Throwing version of above
function dummytP(n) {
    return lifter(f.dummyt(n));
}

makefakes(dummyP, dummytP, lifter);

