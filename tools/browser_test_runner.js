var path = require("path");
var build = require("./build.js");
var Promise = require("bluebird");
var cp = Promise.promisifyAll(require("child_process"));
var fs = Promise.promisifyAll(require("fs"));
var baseDir = path.join(__dirname, "..", "test", "browser");
var browsers = [
    ["Windows XP", "internet explorer", "6"],
    ["Windows XP", "internet explorer", "7"],
    ["Windows XP", "internet explorer", "8"],
    ["Windows 7", "internet explorer", "9"],
    ["Windows 7", "internet explorer", "10"],
    ["Windows 8.1", "internet explorer", "11"],
    ["Windows 7", "firefox", "3.5"],
    ["Windows 7", "firefox", "4"],
    ["Windows 7", "firefox", "25"],
    ["Windows 7", "firefox", "33"],
    ["Windows 7", "chrome", "beta"],
    ["Windows 7", "safari", "5"],
    ["OS X 10.9", "iphone", "8.1"],
    ["OS X 10.8", "safari", "6"],
    ["OS X 10.9", "safari", "7"]
];

var saucelabsOptions = {
    urls: ["http://127.0.0.1:9999/index.html"],
    tunnelTimeout: 30,
    build: process.env.TRAVIS_JOB_ID,
    maxPollRetries: 3,
    throttled: 3,
    browsers: browsers,
    testname: "mocha tests",
    tags: ["master"]
};

module.exports = function(options) {
    var Promise = require("bluebird");
    var ret = Promise.resolve();
    function createServer() {
        var http = require("http");
        var serve = require("serve-static")(baseDir, {'index': ['index.html']});
        var bodyParser = require("body-parser").urlencoded({
            limit: "100mb",
            extended: false
        });
        var server = http.createServer(function(req, res) {
            serve(req, res, function() {
                if (options.cover &&
                    req.url.indexOf("coverdata") >= 0 &&
                    req.method.toLowerCase() === "post") {
                    bodyParser(req, res, function() {
                        try {
                            var json = JSON.parse(req.body.json);
                        } catch (e) {
                            res.writeHead(404, {'Content-Type': 'text/plain'});
                            res.end('404\n');
                            return;
                        }
                        var browser = (req.body.browser + "").replace(/[^a-zA-Z0-9]/g, "");
                        var fileName = path.join(build.dirs.coverage, "coverage-" + browser + ".json");
                        fs.writeFileAsync(fileName, JSON.stringify(json), "utf8").then(function() {
                            res.writeHead(200, {'Content-Type': 'text/plain'});
                            res.end('Success\n');
                        });
                    });
                } else {
                    res.writeHead(404, {'Content-Type': 'text/plain'});
                    res.end('404\n');
                }
            });
        });
        return Promise.promisify(server.listen, server)(options.port)
    }

    if (options.saucelabs) {
        var saucelabsRunner = require("./saucelabs_runner.js");
        ret = createServer().then(function() {
            return saucelabsRunner(saucelabsOptions);
        }).then(function() {
            process.exit(0);
        });
    } else if (options.nw) {
        ret = cp.execAsync((options.nwPath || "nw") + " .", {
            maxBuffer: 2 * 1024 * 1024,
            cwd: path.join(process.cwd(), "test/browser")
        });
    } else {
        var open = require("open");
        ret = createServer().then(function() {
            var url = "http://localhost:" + options.port;
            console.log("Test can be run at " + url);
            if (options.openBrowser && !options.cover) {
                return Promise.promisify(open)(url);
            }
        });
    }
    return ret;
};
