var path = require("path");
var baseDir = path.join(__dirname, "..", "test", "browser");
var browsers = [
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
        var server = http.createServer(function(req, res) {
            serve(req, res, function() {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('404\n');
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
    } else {
        var open = require("open");
        ret = createServer().then(function() {
            var url = "http://localhost:" + options.port;
            console.log("Test can be run at " + url);
            return Promise.promisify(open)(url);
        });
    }
    return ret;
};
