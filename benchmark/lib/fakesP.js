

if (global.useQ)
    var lifter = require('q').denodeify;
else if (global.useBluebird)
    //Currently promisifies only Node style callbacks
    var lifter = require('../../js/main/bluebird.js').promisify;
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
    var Promise = require('lie');
    var slicer = [].slice;
    var lifter = function lifter(nodefn) {
        return function() {
            var p = new Promise(function (resolve, reject){
                arguments[arguments.length++] = function(err, res) {
                    if (err) reject(err);
                    else resolve(res)
                };
                nodefn.apply(this, arguments);
            });
            return p;
        }
    }
}
else if(global.useThenPromise) {
    var Promise = require('promise');
    var slicer = [].slice;
    var lifter = function lifter(nodefn) {
        return function() {
            var p = new Promise(function (resolve, reject){
                arguments[arguments.length++] = function(err, res) {
                    if (err) reject(err);
                    else resolve(res)
                };
                try {
                    nodefn.apply(this, arguments);
                }
                catch (e) {
                    reject(e);
                }
            });
            return p;
        }
    }
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
            var args = new Array(l);
            for (var i = 0; i < l; ++i) {
                args[i] = arguments[i];
            }
            return new Promise(function(resolve, reject) {
                var callback = function(err, val) {
                    if (err) reject(err);
                    else resolve(val);
                };
                args.push(callback);
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

