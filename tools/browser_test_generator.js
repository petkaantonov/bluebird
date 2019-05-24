var Promise = require("bluebird");
var path = require("path");
var readFile = Promise.promisify(require("fs").readFile);
var writeFile = Promise.promisify(require("fs").writeFile);
var stringToStream = require("./utils.js").stringToStream;
var baseDir = path.join(__dirname, "..", "test", "browser");

// Sinon pulls the entire NPM as dependencies (including crypto code) for
// some reason so
// the browserify bundle ends up taking megabyte and having high risk of
// IE-incompatible code
function dependsOnSinon(test) {
    return /3\.2\.5\.|done|nodeify|2\.2\.6/.test(test.name);
};

module.exports = function(tests, options) {
    var testRequires = tests.filter(function(test) {
        return !dependsOnSinon(test) && test.name.indexOf("generator") === -1;
    }).map(function(test) {
        var code = "require('../mocha/" + test.name + "');";
        if (test.name.indexOf("2.3.3") >= 0) {
            code = "if (haveGetters) " + code;
        }
        return code;
    }).join("\n");

    var promiseExport = options.cover
        ? readFile(path.join(baseDir, "promise_instrumented.js"), "utf8")
        : readFile(path.join(baseDir, "promise_debug.js"), "utf8");

    var main = readFile(path.join(baseDir, "main.js"), "utf8")

    return Promise.join(promiseExport, main, function(promiseExport, main) {
        var browserify = require("browserify");
        var contents = promiseExport + "\n" + main + "\n" + testRequires;
        var complete = browserify({
            basedir: baseDir,
            entries: stringToStream(contents)
        });
        var worker = browserify({
            basedir: baseDir,
            entries: stringToStream(promiseExport),
        });
        return Promise.join(
            Promise.promisify(complete.bundle, complete)().then(function(src) {
                return writeFile(path.join(baseDir, "bundle.js"), src);
            }), Promise.promisify(worker.bundle, worker)().then(function (src) {
                return writeFile(path.join(baseDir, "worker_bundle.js"), src);
            }));
    }).then(function() {
        if (options.executeBrowserTests) {
            return require("./browser_test_runner.js")(options);
        }
    }).catch(function(e) {
        console.error(e.stack || e.message);
        process.exit(2);
    });
};
