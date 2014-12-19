var file = process.argv[2];

// Fake timers
var currentTime = 0;
var timers = {};
var currentId = 0;

function checkTimers() {
    Object.keys(timers).forEach(function(key) {
        var timer = timers[key];
        if (currentTime > timer.ends) {
            delete timers[key];
            timer.fn.call(global);
        }
    });
}

function setTimeout(fn, time) {
    var id = currentId++;
    time = (+time || 0) | 0;
    if (time < 0) time = 0;
    timers[id] = {
        fn: fn,
        ends: time + currentTime
    };
    return id;
}

function clearTimeout(id) {
    delete timers[id];
}

(function tick() {
    currentTime += 10;
    checkTimers();
    setImmediate(tick);
})();

global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.adapter = require("./js/debug/bluebird.js");

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
    process.stderr.write(file + "\n" + err.stack + "\n");
    process.exit(-1);
});

