"use strict";
var ASSERT = require("./assert.js");
var schedule;
var _MutationObserver;
if (typeof process === "object" && typeof process.version === "string") {
    schedule = function (fn) {
        process.nextTick(fn);
    };
}
else if ((typeof MutationObserver !== "undefined" &&
         (_MutationObserver = MutationObserver)) ||
         (typeof WebKitMutationObserver !== "undefined" &&
         (_MutationObserver = WebKitMutationObserver))) {
    schedule = (function() {
        var div = document.createElement("div");
        var queuedFn;
        var observer = new _MutationObserver(function() {
            ASSERT(queuedFn !== undefined);
            var fn = queuedFn;
            queuedFn = undefined;
            fn();
        });
        observer.observe(div, {
            attributes: true
        });
        return function(fn) {
            ASSERT(queuedFn === undefined);
            queuedFn = fn;
            div.classList.toggle("foo");
        };

    })();
}
else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
}
else throw new Error("no async scheduler available");
module.exports = schedule;
