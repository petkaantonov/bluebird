module.exports = function mochaRun(progress) {
    var currentTime = 0;
    var timers = {};
    var currentId = 0;

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
                if (timer.domain) timer.domain.enter();
                fn();
                if (timer.domain) timer.domain.exit();
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
            interval: true,
            domain: process.domain
        };
        return id;
    }

    function setTimeout(fn, time) {
        var id = currentId++;
        time = (+time || 0) | 0;
        if (time < 11) time = 11;
        timers[id] = {
            fn: fn,
            time: time,
            started: currentTime,
            interval: false,
            domain: process.domain
        };
        return id;
    }

    function clearTimeout(id) {
        delete timers[id];
    }

    var clearInterval = clearTimeout;
    if (fakeTimers) {
        (function timerLoop() {
            currentTime += 10;
            try {
                checkTimers();
            } finally {
                setImmediate(timerLoop);
            }
        })();

        global.oldSetTimeout = global.setTimeout;
        global.oldClearTimeout = global.clearTimeout;
        global.setTimeout = setTimeout;
        global.clearTimeout = clearTimeout;
        global.setInterval = setInterval;
        global.clearInterval = clearInterval;
    }
    var failures = [];
    delete Error.__BluebirdErrorTypes__;
    global.adapter = cover
        ? require("./js/instrumented/bluebird.js")
        : require("./js/debug/bluebird.js");
    global.Promise = adapter;
    Promise = adapter;
    adapter.defer = adapter.pending = function() {
        var ret = {};
        ret.promise = new Promise(function(resolve, reject) {
            ret.resolve = ret.fulfill = resolve;
            ret.reject = reject;
        });
        return ret;
    };
    Promise.config({cancellation: true});
    Promise.config({longStackTraces: false});
    Promise.config({longStackTraces: true});
    return Promise.each(testGroup, function(test, index, length) {
        var mocha = new Mocha({
            reporter: "spec",
            timeout: 50000, //200 caused non-deterministic test failures
                    //when a test uses timeouts just barely under 200 ms
            slow: Infinity,
            bail: true
        });
        mocha.addFile(test.path);
        return new Promise(function(resolve, reject) {
            mocha.run(function(failures) {
                if (failures === 0) {
                    test.failed = false;
                    progress(test);
                }
                resolve();
            }).on("fail", function(_, err) {
                test.failed = true;
                progress(test);
                failures.push({
                    name: test.name,
                    error: err
                });
            });
        });
    }).then(function() {
        function failAdvice(failedTestFileName) {
            return "For additional details you can run it individually " +
                " with the command `node tools/test --run=" + failedTestFileName + "`";
        }
        if (failures.length > 0) {
            var error;
            if (singleTest) {
                error = failures[0].error;
            }
            else {
                message = "\u001b[31mSome tests failed: \u001b[m\n"
                failures.forEach(function(failResult) {
                    message += "    " + failResult.name + " " + failAdvice(failResult.name) + "\n";
                });
                error = new Error(message);
                error.noStackPrint = true;
            }
            throw error;
        }
        if (cover) {
            return __coverage__;
        }
    });
};
