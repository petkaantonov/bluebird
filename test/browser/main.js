adapter.defer = adapter.pending = function() {
    var ret = {};
    ret.promise = new Promise(function(resolve, reject) {
        ret.resolve = ret.fulfill = resolve;
        ret.reject = reject;
    });
    return ret;
};
(function() {
    var currentTime = 0;
    var timers = {};
    var currentId = 0;
    var global = window;

    function checkTimers() {
        var keys = Object.keys(timers);
        for (var i = 0; i < keys.length; ++i) {
            key = keys[i];
            var timer = timers[key];
            if (!timer) continue;
            if (currentTime >= (timer.started + timer.time)) {
                if (timer.interval) {
                    timer.started = currentTime;
                } else {
                    delete timers[key];
                }
                var fn = timer.fn;
                fn();
            }
        }
    }

    function setInterval(fn, time) {
        var id = currentId++;
        time = (+time || 0) | 0;
        if (time < 0) time = 0;
        timers[id] = {
            fn: fn,
            time: time,
            started: currentTime,
            interval: true
        };
        return id;
    }

    function setTimeout(fn, time) {
        var id = currentId++;
        time = (+time || 0) | 0;
        if (time < 0) time = 0;
        timers[id] = {
            fn: fn,
            time: time,
            started: currentTime,
            interval: false
        };
        return id;
    }

    function clearTimeout(id) {
        delete timers[id];
    }
    window.oldSetTimeout = window.setTimeout;
    window.oldClearTimeout = window.clearTimeout;
    var clearInterval = clearTimeout;
    window.setInterval(function timerLoop() {
        currentTime += 10;
        checkTimers();
    }, 1);
    window.setTimeout = setTimeout;
    window.clearTimeout = clearTimeout;
    window.setInterval = setInterval;
    window.clearInterval = clearInterval;
})();
window.adapter = window.Promise;
global.Promise = global.adapter = window.adapter;
window.assert = require("assert");

var prev = window.assert.deepEqual;
var areDeepEqual = function(a, b) {
    if (Array.isArray(a) &&
        Array.isArray(b)) {
        if (a.length === b.length) {
            for (var i = 0; i < a.length; ++i) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    } else {
        prev.call(window.assert, a, b);
        return true;
    }
};
window.assert.deepEqual = function(a, b) {
    if (!areDeepEqual(a, b)) {
        throw new Error("a not equal to b");
    }
};

window.setImmediate = function(fn){
        setTimeout(fn, 0);
};

window.onload = function(){
    var runner = mocha.run();

    var failedTests = [];
    runner.on('end', function(){
        window.mochaResults = runner.stats;
        window.mochaResults.reports = failedTests;
        if (window.__coverage__) {
          postCoverage();
        }
    });

    runner.on('fail', logFailure);

    function logFailure(test, err) {

    var flattenTitles = function(test){
        var titles = [];
        while (test.parent.title){
            titles.push(test.parent.title);
            test = test.parent;
        }
        return titles.reverse();
    };

    failedTests.push({name: test.title, result: false, message: err.message, stack: err.stack, titles: flattenTitles(test) });
    }
};

function postCoverage() {
    var json = JSON.stringify(window.__coverage__);
    var xhr = new XMLHttpRequest();
    var browser = (navigator.userAgent + "").replace(/[^a-zA-Z0-9]/g, "");
    var data = "json=" + encodeURIComponent(json) + "&browser=" + encodeURIComponent(browser);
    xhr.open("POST", "/coverdata", true);
    xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xhr.send(data);
}
