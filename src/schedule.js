"use strict";
var schedule;
var noAsyncScheduler = function() {
    throw new Error(NO_ASYNC_SCHEDULER);
};
if (require("./util.js").isNode) {
    if (typeof process.versions["node-webkit"] !== "undefined") {
        var version = process.versions["node-webkit"].split(".").map(Number);
        schedule = (version[0] === 0 && version[1] > 8) || (version[0] > 0)
            ? global.setImmediate : process.nextTick;
    } else {
        var version = process.versions.node.split(".").map(Number);
        schedule = (version[0] === 0 && version[1] > 10) || (version[0] > 0)
            ? global.setImmediate : process.nextTick;        
    }

    if (!schedule) {
        if (typeof setImmediate !== "undefined") {
            schedule = setImmediate;
        } else if (typeof setTimeout !== "undefined") {
            schedule = setTimeout;
        } else {
            schedule = noAsyncScheduler;
        }
    }
} else if (typeof MutationObserver !== "undefined") {
    schedule = function(fn) {
        var div = document.createElement("div");
        var observer = new MutationObserver(fn);
        observer.observe(div, {attributes: true});
        return function() { div.classList.toggle("foo"); };
    };
    schedule.isStatic = true;
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;
