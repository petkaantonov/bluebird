"use strict";
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
    schedule = function(fn) {
        var div = document.createElement("div");
        var observer = new _MutationObserver(fn);
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
