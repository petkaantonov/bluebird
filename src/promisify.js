"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = require("./util.js");
var es5 = require("./es5.js");
var nodebackForPromise = require("./promise_resolver.js")
    ._nodebackForPromise;
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var notEnumerableProp = util.notEnumerableProp;
var deprecated = util.deprecated;
var ASSERT = require("./assert.js");


var roriginal = new RegExp(BEFORE_PROMISIFIED_SUFFIX + "$");
var hasProp = {}.hasOwnProperty;
function isPromisified(fn) {
    return fn.__isPromisified__ === true;
}
var inheritedMethods = (function() {
    if (es5.isES5) {
        //Guaranteed since ES-5
        var create = Object.create;
        var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
        return function(cur) {
            var original = cur;
            var ret = [];
            var visitedKeys = create(null);
            //Need to reinvent for-in because getOwnPropertyDescriptor
            //only works if the property is exactly on the object
            while (cur !== null) {
                var keys = es5.keys(cur);
                for (var i = 0, len = keys.length; i < len; ++i) {
                    var key = keys[i];
                    //For shadowing
                    if (visitedKeys[key] ||
                        roriginal.test(key) ||
                        hasProp.call(original, key + BEFORE_PROMISIFIED_SUFFIX)
                   ) {
                        continue;
                    }
                    visitedKeys[key] = true;
                    var desc = getOwnPropertyDescriptor(cur, key);
                    if (desc != null &&
                        typeof desc.value === "function" &&
                        !isPromisified(desc.value)) {
                        ret.push(key, desc.value);
                    }
                }
                cur = es5.getPrototypeOf(cur);
            }
            return ret;
        };
    }
    else {
        return function(obj) {
            var ret = [];
            /*jshint forin:false */
            for (var key in obj) {
                if (roriginal.test(key) ||
                    hasProp.call(obj, key + BEFORE_PROMISIFIED_SUFFIX)) {
                    continue;
                }
                var fn = obj[key];
                if (typeof fn === "function" &&
                    !isPromisified(fn)) {
                    ret.push(key, fn);
                }
            }
            return ret;
        };
    }
})();

//Gives an optimal sequence of argument count to try given a formal parameter
//.length for a function
function switchCaseArgumentOrder(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - PARAM_COUNTS_TO_TRY);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        if (i === likelyArgumentCount) continue;
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= PARAM_COUNTS_TO_TRY; ++i) {
        ret.push(i);
    }
    return ret;
}

function parameterDeclaration(parameterCount) {
    var ret = new Array(parameterCount);
    for(var i = 0; i < ret.length; ++i) {
        ret[i] = "_arg" + i;
    }
    return ret.join(", ");
}

function parameterCount(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, MAX_PARAM_COUNT + 1), 0);
    }
    //Unsupported .length for functions
    return 0;
}

function propertyAccess(id) {
    var rident = /^[a-z$_][a-z$_0-9]*$/i;

    if (rident.test(id)) {
        return "." + id;
    }
    else return "['" + id.replace(/(['\\])/g, "\\$1") + "']";
}

function makeNodePromisifiedEval(callback, receiver, originalName, fn) {
    ASSERT(typeof fn === "function");
                                        //-1 for the callback parameter
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);

    var callbackName = (typeof originalName === "string" ?
        originalName + "Async" :
        "promisified");

    function generateCallForArgumentCount(count) {
        var args = new Array(count);
        for (var i = 0, len = args.length; i < len; ++i) {
            args[i] = "arguments[" + i + "]";
        }
        var comma = count > 0 ? "," : "";

        if (typeof callback === "string" &&
            receiver === THIS) {
            return "this" + propertyAccess(callback) + "("+args.join(",") +
                comma +" fn);"+
                "break;";
        }
        return (receiver === void 0
            ? "callback("+args.join(",")+ comma +" fn);"
            : "callback.call("+(receiver === THIS
                ? "this"
                : "receiver")+", "+args.join(",") + comma + " fn);") +
        "break;";
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for(var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }
        ret += "default: var args = new Array(len + 1);" +
            "var i = 0;" +
            "for (var i = 0; i < len; ++i) { " +
            "   args[i] = arguments[i];" +
            "}" +
            "args[i] = fn;" +

            (typeof callback === "string"
            ? "this" + propertyAccess(callback) + ".apply("
            : "callback.apply(") +

            (receiver === THIS ? "this" : "receiver") +
            ", args); break;";
        return ret;
    }

    return new Function("Promise", "callback", "receiver",
            "withAppended", "maybeWrapAsError", "nodebackForPromise",
            "INTERNAL",
        "var ret = function " + callbackName +
        "(" + parameterDeclaration(newParameterCount) + ") {\"use strict\";" +
        "var len = arguments.length;" +
        "var promise = new Promise(INTERNAL);"+
        "promise._setTrace(" + callbackName + ", void 0);" +
        "var fn = nodebackForPromise(promise);"+
        "try {" +
        "switch(len) {" +
        generateArgumentSwitchCase() +
        "}" +
        "}" +
        "catch(e){ " +
        "var wrapped = maybeWrapAsError(e);" +
        "promise._attachExtraTrace(wrapped);" +
        "promise._reject(wrapped);" +
        "}" +
        "return promise;" +
        "" +
        "}; ret.__isPromisified__ = true; return ret;"
   )(Promise, callback, receiver, withAppended,
        maybeWrapAsError, nodebackForPromise, INTERNAL);
}

function makeNodePromisifiedClosure(callback, receiver) {
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        if (typeof callback === "string") {
            callback = _receiver[callback];
        }
        ASSERT(typeof callback === "function");
        var promise = new Promise(INTERNAL);
        promise._setTrace(promisified, void 0);
        var fn = nodebackForPromise(promise);
        try {
            callback.apply(_receiver, withAppended(arguments, fn));
        }
        catch(e) {
            var wrapped = maybeWrapAsError(e);
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        }
        return promise;
    }
    promisified.__isPromisified__ = true;
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function _promisify(callback, receiver, isAll) {
    if (isAll) {
        var methods = inheritedMethods(callback);
        for (var i = 0, len = methods.length; i < len; i+= 2) {
            var key = methods[i];
            var fn = methods[i+1];
            var originalKey = key + BEFORE_PROMISIFIED_SUFFIX;
            var promisifiedKey = key + AFTER_PROMISIFIED_SUFFIX;
            notEnumerableProp(callback, originalKey, fn);
            callback[promisifiedKey] =
                makeNodePromisified(originalKey, THIS,
                    key, fn);
        }
        util.toFastProperties(callback);
        return callback;
    }
    else {
        return makeNodePromisified(callback, receiver, void 0, callback);
    }
}

Promise.promisify = function Promise$Promisify(fn, receiver) {
    if (typeof fn === "object" && fn !== null) {
        deprecated(OBJECT_PROMISIFY_DEPRECATED);
        return _promisify(fn, receiver, true);
    }
    if (typeof fn !== "function") {
        throw new TypeError(NOT_FUNCTION_ERROR);
    }
    if (isPromisified(fn)) {
        return fn;
    }
    return _promisify(
        fn,
        arguments.length < 2 ? THIS : receiver,
        false);
};

Promise.promisifyAll = function Promise$PromisifyAll(target) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError(PROMISIFY_TYPE_ERROR);
    }
    return _promisify(target, void 0, true);
};
};

