var assert = require("assert");
assert.equal(require.main, module);
var Promise = require("bluebird");
var build = require("./build.js");
var tableLogger = require("./utils.js").tableLogger;
var argv = require("optimist").argv;
var glob = Promise.promisify(require("glob"));
var path = require("path");
var jobRunner = require("./job-runner/job-runner.js");
var mochaRunner = require("./mocha_runner.js");
jobRunner.setVerbose(0);
// Random slowness after tests complete
function getTests(options) {
    var g;
    if (options.testName === "all") {
        g = "./test/mocha/*.js";
    } else if (options.testName === "aplus") {
        g = "./test/mocha/[0-9].[0-9].[0-9].js";
    } else {
        var testName = options.testName.replace(/^(\d)(\d)(\d)$/, "$1.$2.$3");
        g = "./test/mocha/" + testName + ".js";
    }
    return glob(g).then(function(matches) {
        return matches.filter(function(match) {
            if (match.indexOf("generator") >= 0) {
                return options.generators;
            }
            return true;
        })
    }).tap(function(m) {
        if (m.length === 0) {
            throw new Error("No test file matches: '" + options.testName + "'");
        }
    }).map(function(filePath, i) {
        var name = path.basename(filePath);
        return {
            name: name,
            path: filePath,
            index: i,
            nameMatcher: "\\b" +
                name.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") +
                "\\b"
        };
    });
}

function needsFreshProcess(testName) {
    return /domain|schedule|api_exceptions|promisify/.test(testName);
}

function runTestGroup(testGroup, options, progress) {
    return jobRunner.run(mochaRunner, {
        isolated: !options.singleTest,
        log: options.singleTest,
        progress: progress,
        context: {
            testGroup: testGroup,
            singleTest: options.singleTest,
            fakeTimers: options.fakeTimers
        }
    });
}

function combineTests(tests) {
    var arrays = new Array(jobRunner.CHILD_PROCESSES);
    for (var i = 0; i < arrays.length; ++i) {
        arrays[i] = [];
    }

    var initialLength = arrays.length;
    for (var i = 0; i < tests.length; ++i) {
        var test = tests[i];
        if (needsFreshProcess(test.name)) {
            arrays.push([test]);
        } else {
            arrays[i % initialLength].push(tests[i]);
        }

    }
    return arrays;
}

var testName = "all";
if ("run" in argv) {
    testName = (argv.run + "")
        .toLowerCase()
        .replace( /\.js$/, "" )
        .replace( /[^a-zA-Z0-9_\-.]/g, "" );
}

var options = {
    generators: process.execArgv.filter(function(v) {
        var sanitized = v.toLowerCase().replace(/[_\-]/g, "").split("=")[0];
        return sanitized === "harmony" || sanitized === "harmonygenerators";
    }).length > 0,
    testName: testName,
    singleTest: false,
    saucelabs: !!argv.saucelabs,
    testBrowser: !!argv.saucelabs || !!argv.browser,
    executeBrowserTests: !!argv.saucelabs || (typeof argv["execute-browser-tests"] === "boolean" ?
        argv["execute-browser-tests"] : !!argv.browser),
    port: argv.port || 9999,
    fakeTimers: typeof argv["fake-timers"] === "boolean"
        ? argv["fake-timers"] : true,
    jsHint: typeof argv["js-hint"] === "boolean" ? argv["js-hint"] : true
};


var jsHint = options.jsHint ? require("./jshint.js")() : Promise.resolve();
var tests = getTests(options);
var buildResult = build({
    debug: true
});
var testResults = Promise.join(tests, buildResult, function(tests) {
    var singleTest = tests.length === 1;
    options.singleTest = singleTest;
    process.stdout.write("\u001b[m");
    if (options.testBrowser) {
        return require("./browser_test_generator.js")(tests, options);
    } else if (singleTest) {
        return runTestGroup(tests, options);
    } else {
        process.stdout.cursorTo(0, 0);
        process.stdout.clearScreenDown();
        tableLogger.addTests(tests);
        return Promise.map(combineTests(tests), function(testGroup) {
            return runTestGroup(testGroup, options, function(test) {
                if (test.failed) {
                    tableLogger.testFail(test);
                } else {
                    tableLogger.testSuccess(test);
                }
            })
        }).then(function() {
            console.log("All tests passed");
        });
    }
});

Promise.all([testResults, jsHint]).spread(function(_, jsHintResponse) {
    if (jsHintResponse) {
        console.log("JSHint:");
        console.log(jsHintResponse.stdout);
        console.log(jsHintResponse.stderr);
    }
}).catch(function(e) {
    if (e && e.stdout || e.stderr) {
        console.log(e.stdout);
        console.error(e.stderr);
    }

    if (!e || !e.stack) {
        console.error(e + "");
    } else {
        console.error(e.noStackPrint ? e.message : e.stack);
    }

    if (e) {
        Object.keys(e).forEach(function(key) {
            console.error(key, e[key]);
        });
    }
    process.exit(2);
});
