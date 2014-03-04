"use strict";
var global = require("./global.js");
var ASSERT = require("./assert.js");
var schedule;
if (typeof process !== "undefined" && process !== null &&
    typeof process.cwd === "function" &&
    typeof process.nextTick === "function") {
    // node.js 0.10.xx has a different nextTick behavior
    // from 0.11.xx which leads to losing the active domain
    // when promise is getting resolved or rejected, and so
    // we have to track active domain by ourselves
    if (process.version && process.version.indexOf("v0.10.") === 0) {
        schedule = (function () {
            var domain = require("domain");
            var activeDomain = null;
            var callback = null;
            function Promise$_Scheduler() {
                var fn = callback;
                var domain = activeDomain;
                activeDomain = null;
                callback = null;
                ASSERT(typeof fn === "function");
                if (domain != null) domain.run(fn); else fn();

            }
            return function schedule(fn) {
                //ensure there are no calls in-between next tick and saving
                //these variables
                ASSERT(callback === null);
                activeDomain = domain.active;
                callback = fn;
                process.nextTick(Promise$_Scheduler);
            };
        })();
    } else {
        schedule = process.nextTick;
    }
}
else if ((typeof global.MutationObserver === "function" ||
        typeof global.WebkitMutationObserver === "function" ||
        typeof global.WebKitMutationObserver === "function") &&
        typeof document !== "undefined" &&
        typeof document.createElement === "function") {


    schedule = (function(){
        var MutationObserver = global.MutationObserver ||
            global.WebkitMutationObserver ||
            global.WebKitMutationObserver;
        var div = document.createElement("div");
        var queuedFn = void 0;
        var observer = new MutationObserver(
            function Promise$_Scheduler() {
                ASSERT(queuedFn !== void 0);
                var fn = queuedFn;
                queuedFn = void 0;
                fn();
            }
       );
        observer.observe(div, {
            attributes: true
        });
        return function Promise$_Scheduler(fn) {
            ASSERT(queuedFn === void 0);
            queuedFn = fn;
            div.setAttribute("class", "foo");
        };

    })();
}
else if (typeof global.postMessage === "function" &&
    typeof global.importScripts !== "function" &&
    typeof global.addEventListener === "function" &&
    typeof global.removeEventListener === "function") {

    var MESSAGE_KEY = "bluebird_message_key_" + Math.random();
    schedule = (function(){
        var queuedFn = void 0;

        function Promise$_Scheduler(e) {
            if (e.source === global &&
                e.data === MESSAGE_KEY) {
                ASSERT(queuedFn !== void 0);
                var fn = queuedFn;
                queuedFn = void 0;
                fn();
            }
        }

        global.addEventListener("message", Promise$_Scheduler, false);

        return function Promise$_Scheduler(fn) {
            ASSERT(queuedFn === void 0);
            queuedFn = fn;
            global.postMessage(
                MESSAGE_KEY, "*"
           );
        };

    })();
}
else if (typeof global.MessageChannel === "function") {
    schedule = (function(){
        var queuedFn = void 0;

        var channel = new global.MessageChannel();
        channel.port1.onmessage = function Promise$_Scheduler() {
                ASSERT(queuedFn !== void 0);
                var fn = queuedFn;
                queuedFn = void 0;
                fn();
        };

        return function Promise$_Scheduler(fn) {
            ASSERT(queuedFn === void 0);
            queuedFn = fn;
            channel.port2.postMessage(null);
        };
    })();
}
else if (global.setTimeout) {
    schedule = function Promise$_Scheduler(fn) {
        setTimeout(fn, 4);
    };
}
else {
    schedule = function Promise$_Scheduler(fn) {
        fn();
    };
}

module.exports = schedule;
