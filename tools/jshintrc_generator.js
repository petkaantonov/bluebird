var assert = require("assert");
assert.equal(require.main, module);
// Since many globals are dynamic, this file is needed to generate jshintrc dynamically
var Promise = require("bluebird");
var path = require("path");
Promise.longStackTraces();
var fs = Promise.promisifyAll(require("fs"));

var constantsFile = path.join(__dirname, "..", "src", "constants.js");
var globals = fs.readFileAsync(constantsFile, "utf8").then(function(contents) {
    var rconstantname = /CONSTANT\(\s*([^,]+)/g;
    var m;
    var globals = {
        Error: true,
        args: true,
        JSON: true,
        chrome: true,
        INLINE_SLICE: false,
        global: true,
        setImmediate: true,
        Promise: true,
        WebKitMutationObserver: true,
        TypeError: true,
        RangeError: true,
        __DEBUG__: false,
        __BROWSER__: false,
        process: true,
        self: true,
        "console": false,
        "require": false,
        "module": false,
        "define": false
    };
    while((m = rconstantname.exec(contents))) {
        globals[m[1]] = false;
    }
    return globals;
});

var jshintrcFile = path.join(__dirname, "..", ".jshintrc");
var jshintrc = fs.readFileAsync(jshintrcFile, "utf8").then(JSON.parse);

Promise.join(jshintrc, globals, function(jshintrc, globals) {
    jshintrc.globals = globals;
    var json = JSON.stringify(jshintrc, null, "    ");
    return fs.writeFileAsync(jshintrcFile, json);
});
