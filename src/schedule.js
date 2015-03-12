"use strict";
var schedule;
if (require("./util.js").isNode) {
    schedule = process.nextTick;
} else if (typeof MutationObserver !== "undefined") {
    schedule = function(fn) {
        var div = document.createElement("div");
        var observer = new MutationObserver(fn);
        observer.observe(div, {attributes: true});
        return function() { div.classList.toggle("foo"); };
    };
    schedule.isStatic = true;
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = function() {
        throw new Error(NO_ASYNC_SCHEDULER);
    };
}
module.exports = schedule;
