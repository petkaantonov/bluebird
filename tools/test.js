var assert = require("assert");
assert.equal(require.main, module);
var Promise = require("bluebird");
var build = require("./build.js");
var utils = require("./utils.js");
var tableLogger = utils.tableLogger;
var argv = require("optimist").argv;
var glob = Promise.promisify(require("glob"));
var path = require("path");
var mkdirp = Promise.promisify(require("mkdirp"));
var rimraf = Promise.promisify(require("rimraf"));
var jobRunner = require("./job-runner/job-runner.js");
var mochaRunner = require("./mocha_runner.js");
var fs = Promise.promisifyAll(require("fs"));
jobRunner.setVerbose(0);
// Random slowness after tests complete
function getTests(options) {
    var g;
    if (options.testName === "all") {
        g = "./test/mocha/*.js";
    } else if (options.testName === "aplus") {
        g = "./test/mocha/[0-9].[0-9].[0-9].js";
    } else if (options.testName.indexOf("*") >= 0) {
        g = "./test/mocha/" + options.testName;
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

function getColorForCoverage(coveragePct) {
    var colorThresholds = {
        95: "brightgreen",
        85: "green",
        80: "yellowgreen",
        70: "yellow",
        60: "red"
    };
    var values = Object.keys(colorThresholds).map(Number).sort(function(a, b) {
        return b - a;
    });
    for (var i = 0; i < values.length; ++i) {
        if (coveragePct >= values[i]) return colorThresholds[values[i].toString()];
    }
    return colorThresholds[values[values.length - 1].toString()];
}

function getCoverage() {
    return utils.run("npm", ["run", "istanbul", "--", "report", "text-summary"]).then(function(result) {
        var stdout = result.stdout;
        var pctPattern = /(\d+\.\d+)%/g;
        var matches = stdout.match(pctPattern);
        var sum = matches.map(function(pct) {
            return parseFloat(pct.replace(/[^0-9.]/g, ""))
        }).reduce(function(a, b) {
            return a + b;
        }, 0);
        var average = Math.round(sum / matches.length);
        return average;
    });
}

function generateCoverageBadge(coverage) {
    var text = "coverage-" + coverage + "%";
    var color = getColorForCoverage(coverage);
    var imgSrc = "http://img.shields.io/badge/" + text + "-" + color + ".svg?style=flat";
    var link = "http://petkaantonov.github.io/bluebird/coverage/debug/index.html";
    var markdown = "[!["+text+"]("+imgSrc+")]("+link+")";
    return markdown;
}

function writeCoverageFile(coverage, groupNumber) {
    var dir = build.dirs.coverage;
    var fileName = path.join(dir, "coverage-group" + groupNumber + ".json");
    var json = JSON.stringify(coverage);
    return fs.writeFileAsync(fileName, json, "utf8").thenReturn(fileName);
}

function needsFreshProcess(testName) {
    return /domain|multiple-copies/.test(testName);
}

function runTestGroup(testGroup, options, progress) {
    return jobRunner.run(mochaRunner, {
        isolated: !options.singleTest,
        log: options.singleTest,
        progress: progress,
        context: {
            testGroup: testGroup,
            singleTest: options.singleTest,
            fakeTimers: options.fakeTimers,
            cover: options.cover
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
    testName = (argv.run + "");
    if (testName.indexOf("*") === -1) {
        testName = testName.toLowerCase()
            .replace( /\.js$/, "" )
            .replace( /[^a-zA-Z0-9_\-.]/g, "" );
    }
}

var options = {
    generators: (function() {
        try {
            new Function("(function*(){})");
            return true;
        } catch (e) {
            return false;
        }
    })() || !!argv.nw,
    cover: !!argv["cover"],
    testName: testName,
    singleTest: false,
    saucelabs: !!argv.saucelabs,
    testBrowser: !!argv.saucelabs || !!argv.browser || !!argv.nw,
    executeBrowserTests: !!argv.saucelabs || !!argv.nw || (typeof argv["execute-browser-tests"] === "boolean" ?
        argv["execute-browser-tests"] : !!argv.browser),
    openBrowser: typeof argv["open-browser"] === "boolean" ? argv["open-browser"] : true,
    port: argv.port || 9999,
    fakeTimers: typeof argv["fake-timers"] === "boolean"
        ? argv["fake-timers"] : true,
    jsHint: typeof argv["js-hint"] === "boolean" ? argv["js-hint"] : true,
    nw: !!argv.nw,
    nwPath: argv["nw-path"]
};



if (options.cover && typeof argv["cover"] === "string") {
    options.coverFormat = argv["cover"];
} else {
    options.coverFormat = "html";
}

var jsHint = options.jsHint ? require("./jshint.js")() : Promise.resolve();
var tests = getTests(options);
var buildOpts = {
    debug: true
};
if (options.testBrowser) {
    buildOpts.browser = true;
    buildOpts.minify = true;
}
var buildResult = build(buildOpts);
if (options.cover) {
    var exclusions = ["assert.js", "captured_trace.js"];
    var coverageInstrumentedRoot = build.ensureDirectory(build.dirs.instrumented,options.cover);
    var coverageReportsRoot = mkdirp(build.dirs.coverage, true).then(function() {
        return fs.readdirAsync(build.dirs.coverage);
    }).map(function(fileName) {
        var filePath = path.join(build.dirs.coverage, fileName);
        if (path.extname(fileName).indexOf("json") === -1) {
            return rimraf(filePath);
        }
    });
    buildResult = Promise.join(coverageInstrumentedRoot, buildResult, coverageReportsRoot, function() {
        return utils.run("npm", ["-v"]).then(function(result) {
            var version = result.stdout.split(".").map(Number);
            if (version[0] < 2) {
                throw new Error("Npm version 2.x.x required, current version is " + result.stdout);
            }
        });
    }).tap(function() {
        var copyExclusions = Promise.map(exclusions, function(exclusion) {
            var fromPath = path.join(build.dirs.debug, exclusion);
            var toPath = path.join(build.dirs.instrumented, exclusion);
            return fs.readFileAsync(fromPath, "utf8").then(function(contents) {
                return fs.writeFileAsync(toPath, contents, "utf8");
            });
        });
        var args = [
            "run",
            "istanbul",
            "--",
            "instrument",
            "--output",
            build.dirs.instrumented,
            "--no-compact",
            "--preserve-comments",
            "--embed-source"
        ];
        exclusions.forEach(function(x) {
            args.push("-x", x);
        });
        args.push(build.dirs.debug);
        var istanbul = utils.run("npm", args, null, true);
        return Promise.all([istanbul, copyExclusions]);
    });
}

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
        return Promise.map(combineTests(tests), function(testGroup, index) {
            return runTestGroup(testGroup, options, function(test) {
                if (test.failed) {
                    tableLogger.testFail(test);
                } else {
                    tableLogger.testSuccess(test);
                }
            }).then(function(maybeCoverage) {
                if (options.cover) {
                    return writeCoverageFile(maybeCoverage.result, index + 1);
                }
            })
        }).then(function() {
            var p = Promise.resolve();
            if (options.cover) {
                var coverage = getCoverage();
                if (process.execPath.indexOf("iojs") >= 0 && testName === "all") {
                    p = p.return(coverage).then(generateCoverageBadge).then(console.log);
                }
                p = p.then(function() {
                    return utils.run("npm", ["run", "istanbul", "--", "report", options.coverFormat], null, true);
                }).return(coverage).then(function(coverage) {
                    console.log("Total coverage " + coverage + "%");
                });
            }
            console.log("All tests passed");
            return p;
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
    process.exit(2);
});
