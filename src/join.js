"use strict";
module.exports =
function(Promise, PromiseArray, cast, INTERNAL) {
var util = require("./util.js");
var tryCatch1 = util.tryCatch1;
var errorObj = util.errorObj;

function checkFulfillment(promise, holder) {
    var now = holder.now;
    now++;
    var total = holder.total;
    if (now >= total) {
        var handler = callers[total];
        var ret = tryCatch1(handler, void 0, holder);
        if (ret === errorObj) {
            ret._rejectUnchecked(ret.e);
        }
        else if (!promise._tryFollow(ret)) {
            promise._fulfillUnchecked(ret);
        }
    }
    else {
        holder.now = now;
    }
}

var thenCallbacks = [
    function(value, holder) {
        holder.p1 = value;
        checkFulfillment(this, holder);
    },
    function(value, holder) {
        holder.p2 = value;
        checkFulfillment(this, holder);
    },
    function(value, holder) {
        holder.p3 = value;
        checkFulfillment(this, holder);
    },
    function(value, holder) {
        holder.p4 = value;
        checkFulfillment(this, holder);
    },
    function(value, holder) {
        holder.p5 = value;
        checkFulfillment(this, holder);
    }
];

var callers = [
    function(holder) {
        var callback = holder.fn;
        return callback();
    },
    function(holder) {
        var callback = holder.fn;
        return callback(holder.p1);
    },
    function(holder) {
        var callback = holder.fn;
        return callback(holder.p1, holder.p2);
    },
    function(holder) {
        var callback = holder.fn;
        return callback(holder.p1, holder.p2, holder.p3);
    },
    function(holder) {
        var callback = holder.fn;
        return callback(holder.p1, holder.p2, holder.p3, holder.p4);
    },
    function(holder) {
        var callback = holder.fn;
        return callback(holder.p1, holder.p2, holder.p3, holder.p4, holder.p5);
    }
];

function Holder(total, fn) {
    this.p1 = this.p2 = this.p3 = this.p4 = this.p5 = null;
    this.fn = fn;
    this.total = total;
    this.now = 0;
}

Promise.join = function Promise$Join() {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (last < 6) {
            var ret = new Promise(INTERNAL);
            ret._setTrace(void 0);
            var holder = new Holder(last, fn);
            var reject = ret._reject;
            var callbacks = thenCallbacks;
            for (var i = 0; i < last; ++i) {
                var maybePromise = cast(arguments[i], void 0);
                if (maybePromise instanceof Promise) {
                    if (maybePromise.isPending()) {
                        maybePromise._then(callbacks[i], reject,
                                           void 0, ret, holder);
                    }
                    else if (maybePromise.isFulfilled()) {
                        callbacks[i].call(ret,
                                          maybePromise._settledValue, holder);
                    }
                    else {
                        ret._reject(maybePromise._settledValue);
                        maybePromise._unsetRejectionIsUnhandled();
                    }
                }
                else {
                    callbacks[i].call(ret, maybePromise, holder);
                }
            }
            return ret;
        }
    }
    INLINE_SLICE(args, arguments);
    var ret = new PromiseArray(args).promise();
    return fn !== void 0 ? ret.spread(fn) : ret;
};

};
