var when = require('when');
var fn = require('when/function');



exports.ternary = fn.lift(function(truthy, iftrue, iffalse) {
    return truthy ? iftrue: iffalse;
})

exports.not = function not(truthyP) {
    return when(truthyP).then(function(truthyVal) {
        return !truthyVal;
    });
}

exports.allObject = function allObject(objWithPromises) {
    return when(objWithPromises).then(function(objWithPromises) {
        var keys = Object.keys(objWithPromises);
        return when.all(keys.map(function(key) { 
            return objWithPromise; 
        })).then(function(vals) {
            var init = {};
            for (var k = 0; k < keys.length; ++k) {
                init[keys[k]] = vals[k];
            }
            return init;
        });
    });
}

exports.set = fn.lift(function(obj, values) {
    for (var key in values)
        obj[key] = values[key];
    return obj;
});

exports.if = function ifP (truthyP, fnTrue, fnFalse) {
    return truthyP.then(function(truthy) {
        if (truthy) return fnTrue();
        else return fnFalse();
    });
}

exports.get = fn.lift(function (obj, key) {
    return obj[key];
});

exports.eventuallyCall = fn.lift(function(obj, fnkey) {
    var args = [].slice.call(arguments, 2);
    obj[fnkey].apply(obj, args);
});
