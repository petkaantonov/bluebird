// This test makes an assumption that local git repository does not have uncommitted changes
var Promise = require("bluebird");
var exec = Promise.promisify(require("child_process").exec);
var fs = Promise.promisifyAll(require("fs"));
var argv = require("optimist").argv;

const ALLOWED_ERROR = 0.2;

const testConfigs = [{"n":10000,"t":1},{"n":10000,"t":50},{"n":10000,"t":1000}];
var result = {"master":{},"local":{}};

function measure(branch, config) {
    return exec("node --harmony performance.js --n " + config.n + " --t " + config.t + " --p --file ./doxbee-sequential/promises-bluebird.js",
        {cwd:"benchmark"}).then(function (output) {
        //console.log(branch +" - " + JSON.stringify(config)+" - "+output[0]);
        result[branch]["n"+config.n+"t"+config.t] = JSON.parse(output[0]);
    });
}

function measureAllConfigs(branch) {
    var executions = measure(branch, testConfigs[0]);
    for (var i = 1; i < testConfigs.length; i++) {
        executions = executions.then(function (config) {
            return function () {
                return measure(branch, config);
            };
        }(testConfigs[i]));
    }
    return executions;
}

var branch = argv["branch"];
if (!branch) {
    branch = "origin/master";
}
console.log("\nRunning performance test...");
exec("git remote add perf_origin https://github.com/petkaantonov/bluebird.git").catch(function () {
    // Adding the remote fails when it already exists
}).then(function () {
    return exec("git fetch perf_origin");
}).then(function () {
    return exec("node tools/build.js --release");
}).then(function () {
    return measureAllConfigs("local");
}).then(function () {
    return exec("git checkout " + branch, {});
}).then(function () {
    return exec("node tools/build.js --release", {});
}).then(function () {
    return measureAllConfigs("master");
}).then(function () {
    var props = ["time","mem"];
    var combinedResult = true;
    for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        console.log("="+prop+"=");
        console.log("test config:\t" + branch + ":\tlocal:\tstatus:");
        for (config in result.master) {
            var masterResult = result.master[config][prop];
            var localResult = result.local[config][prop];
            var status = Math.abs(localResult - masterResult) < ALLOWED_ERROR * (localResult + masterResult) / 2;
            // Skipping the results of time for first configuration result.*.n10000t1.time as this test is not stable
            combinedResult = combinedResult && (!!status || (config == "n10000t1" && prop == "time"));
            console.log(config + "\t" + masterResult + "\t" + localResult + "\t" + (status ? "OK" : "<--"));
        }
    }
    if (!combinedResult) {
        console.error("\n\nPerformance regression!\n\n");
    } else {
        console.log("OK");
    }
    return exec("git checkout -", {});
});
