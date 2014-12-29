var file = process.argv[2];
var singleTest = process.env.singleTest === "true";
// Fake timers
var currentTime = 0;
var timers = {};
var currentId = 0;

function checkTimers() {
    Object.keys(timers).forEach(function(key) {
        var timer = timers[key];

        if (currentTime >= (timer.started + timer.time)) {
            if (timer.interval) {
                timer.started = currentTime;
            } else {
                delete timers[key];
            }
            timer.fn.call(global);
        }
    });
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

var clearInterval = clearTimeout;

(function tick() {
    currentTime += 10;
    try {
        checkTimers();
    } finally {
        setImmediate(tick);
    }
})();

global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.setInterval = setInterval;
global.clearInterval = clearInterval;
global.adapter = require("./js/debug/bluebird.js");

function printFailedTestAdvice(failedTestFileName) {
    console.error("The test " + failedTestFileName + " failed.");
    failedTestFileName = failedTestFileName
        .replace("mocha", "")
        .replace( /\.js$/, "" )
        .replace( /[^a-zA-Z0-9_-]/g, "" );
    console.error("For additional details you can run it individually " +
        " ẁith the command `grunt test --run=" + failedTestFileName + "`");
}


var Mocha = require("mocha");
var mochaOpts = {
    reporter: "spec",
    timeout: 50000, //200 caused non-deterministic test failures
            //when a test uses timeouts just barely under 200 ms
    slow: Infinity
};

var mocha = new Mocha(mochaOpts);
mocha.addFile(process.argv[2]);
mocha.run(function(err){
    process.exit(0);
}).on( "fail", function( test, err ) {
    if (!singleTest) {
        printFailedTestAdvice(file);
    }
    console.error(err.stack + "");
    process.exit(-1);
});

