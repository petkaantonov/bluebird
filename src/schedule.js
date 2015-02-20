"use strict";
var schedule;
if (require("./util.js").isNode) {
    var version = process.versions.node.split(".").map(Number);
    schedule = (version[0] === 0 && version[1] > 10) || (version[0] > 0)
        ? global.setImmediate : process.nextTick;
}
else if (typeof MessageChannel !== "undefined") {
    schedule = (function() {
        var queuedFn = void 0;
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot 
        // create working message ports the first time a page loads.
        channel.port1.onmessage = function _scheduleExec() {
            queuedFn();
        };
        return function _schedulePost(fn)  {
            queuedFn = fn;
            channel.port2.postMessage(0);
        };
    })();
}
else if (typeof MutationObserver !== "undefined") {
    schedule = function(fn) {
        var div = document.createElement("div");
        var observer = new MutationObserver(fn);
        observer.observe(div, {attributes: true});
        return function() { div.classList.toggle("foo"); };
    };
    schedule.isStatic = true;
}
else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
}
else {
    schedule = function() {
        throw new Error(NO_ASYNC_SCHEDULER);
    };
}
module.exports = schedule;
