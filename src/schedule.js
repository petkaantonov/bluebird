"use strict";
var util = require("./util");
var schedule;
var noAsyncScheduler = function() {
    throw new Error(NO_ASYNC_SCHEDULER);
};
var NativePromise = util.getNativePromise();
// This file figures out which scheduler to use for Bluebird. It normalizes
// async task scheduling across target platforms. Note that not all JS target
// platforms come supported. The scheduler is overridable with `setScheduler`.

// Our scheduler for NodeJS/io.js is setImmediate for recent
// versions of node because of macrotask semantics.
// The `typeof` check is for an edge case with nw.js.
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if (typeof NativePromise === "function") {
    var nativePromise = NativePromise.resolve();
    schedule = function(fn) {
        nativePromise.then(fn);
    };
// Outside of Node, we're using MutationObservers because they provide low
// latency. The second check is to guard against iOS standalone apps which
// do not fire DOM mutation events for some reason on iOS 8.3+.
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            window.navigator.standalone)) {
    schedule = (function() {
        // Using 2 mutation observers to batch multiple updates into one.
        var div = document.createElement("div");
        var opts = {attributes: true};
        var toggleScheduled = false;
        var div2 = document.createElement("div");
        var o2 = new MutationObserver(function() {
            div.classList.toggle("foo");
            toggleScheduled = false;
        });
        o2.observe(div2, opts);

        var scheduleToggle = function() {
            if (toggleScheduled) return;
                toggleScheduled = true;
                div2.classList.toggle("foo");
            };

            return function schedule(fn) {
            var o = new MutationObserver(function() {
                o.disconnect();
                fn();
            });
            o.observe(div, opts);
            scheduleToggle();
        };
    })();
// setImmediate has higher latency but is still pretty good. This is useful for
// cases where MutationObserver is not defined (older IE, for example).
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
// setTimeout also works, it has the most latency but it does the trick.
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
// Do __Not__ default to a sync scheduler, that would break Promises/A+
// compliancy and cause race conditions.
    schedule = noAsyncScheduler;
}
module.exports = schedule;
