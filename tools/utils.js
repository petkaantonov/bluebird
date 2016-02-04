var Promise = require("bluebird");
var assert = require("assert");
var path = require("path");
var spawn = require("cross-spawn");
Promise.longStackTraces();
var fs = Promise.promisifyAll(require("fs"));
var notAscii = /[^\u000D\u0019-\u007E]/;
var Table = require('cli-table');

function noStackError(message) {
    var e = new Error(message);
    e.noStackPrint = true;
    return e;
}

function checkAscii(fileName, contents) {
    if (notAscii.test(contents)) {
        contents.split("\n").forEach(function(line, i) {
            if (notAscii.test(line)) {
                var lineNo = i + 1;
                var col = line.indexOf(RegExp.lastMatch) + 1;
                var code = "U+" + (("0000" + line.charCodeAt(col-1)
                                                    .toString(16)).slice(-4));
                code = RegExp.lastMatch + " (" + code.toUpperCase() + ")";
                var fullPath = path.join(process.cwd(), "src", fileName);
                throw noStackError("The file " + fullPath + "\ncontains an illegal character: " +
                    code + " on line " + lineNo + " at column " + col);
            }
        });
    }
}

var license;
function getLicense() {
    if (license) return license;
    var licenseFile = path.join(__dirname, "..", "LICENSE");
    return license = fs.readFileAsync(licenseFile, "utf8").then(function(text) {
        return "/* @preserve\n" + text.split("\n").map(function(line) {
            return " * " + line;
        }).join("\n") + "\n */\n";
    });
}

function cursorTo(x, y) {
    if (process.stdout.cursorTo)
        process.stdout.cursorTo(x, y);
}

function clearScreenDown() {
    if (process.stdout.clearScreenDown)
        process.stdout.clearScreenDown();
}

function run(cmd, args, dir, log) {
    return new Promise(function(resolve, reject) {
        function makeResult(errorMessage) {
            var ret = errorMessage ? new Error(errorMessage) : {};
            ret.stdout = out.trim();
            ret.stderr = err.trim();
            return ret;
        }

        var out = "";
        var err = "";
        var c = spawn(cmd, args, {stdin: ["ignore", "ignore", "ignore"], cwd: dir || process.cwd()});

        c.stdout.on("data", function(data) {
            if (log) process.stdout.write(data.toString());
            out += data;
        });
        c.stderr.on("data", function(data) {
            if (log) process.stderr.write(data.toString());
            err += data;
        });

        c.on("error", function(err) {
            reject(makeResult(err.message));
        });
        c.on("close", function(code) {
            if (code == 0) resolve(makeResult())
            else reject(makeResult(path.basename(cmd) + " exited with code: " + code + "\n" + err.trim()));
        })
    });
}

function parseDeps(src) {
    var rdeps  = /function\s*\(\s*([^)]+)\)/;
    var match = rdeps.exec(src);
    assert.equal(match.length, 2);
    var deps = match[1].split(/\s*,\s*/g).map(function(val) {
        return val.trim();
    });
    return deps;
}

var tableLogger = (function() {
    var metaKeyCodeReAnywhere = /(?:\x1b)([a-zA-Z0-9])/;
    var metaKeyCodeRe = new RegExp('^' + metaKeyCodeReAnywhere.source + '$');
    var functionKeyCodeReAnywhere = new RegExp('(?:\x1b+)(O|N|\\[|\\[\\[)(?:' + [
      '(\\d+)(?:;(\\d+))?([~^$])',
      '(?:M([@ #!a`])(.)(.))', // mouse
      '(?:1;)?(\\d+)?([a-zA-Z])'
    ].join('|') + ')');

    function stripVTControlCharacters(str) {
      str = str.replace(new RegExp(functionKeyCodeReAnywhere.source, 'g'), '');
      return str.replace(new RegExp(metaKeyCodeReAnywhere.source, 'g'), '');
    }

    var ROWS = 35;
    var prevLog = new Array(ROWS);
    var log = new Array(ROWS);
    for (var i = 0; i < ROWS; ++i) log[i] = [];
    var tableOpts = {
        chars: {
            'mid': '',
            'left-mid': '',
            'mid-mid': '',
            'right-mid': ''
        },
        style: {
            'padding-left': 0,
            'padding-right': 0,
            compact: true
        }
    };
    var table;
    var split;

    function showTable() {
        assert(!table);
        table = new Table(tableOpts);
        table.push.apply(table, log);
        table = table.toString();
        split = table.split("\n").map(function(line) {
            return stripVTControlCharacters(line);
        });
        cursorTo(0, 0);
        process.stdout.write(table);
        cursorTo(0, split.length + 1);
    }

    function addTests(tests) {
        var cols = 0;
        tests.forEach(function(test) {
            var index = test.index;
            var row = index % ROWS;
            var column = (index / ROWS) | 0;
            cols = Math.max(column, cols);
            log[row][column] = "\u001b[m" + test.name + " \u001b[31m\u00D7   ";
        });
        cols = cols + 1;
        for (var i = 0; i < log.length; ++i) {
            var row = log[i];
            for (var j = 0; j < cols; ++j) {
                if (!row[j]) {
                    row[j] = "  ";
                }
            }
        }
        showTable();
    }

    function getPosition(test) {
        for (var y = 0; y < split.length; ++y) {
            var s = split[y];
            var x = s.search(new RegExp(test.nameMatcher));
            if (x >= 0) {
                return {
                    x: x + test.name.length,
                    y: y
                };
            }
        }
        assert(false);
    }

    function update(test, message) {
        var pos = getPosition(test);
        cursorTo(pos.x + 1, pos.y);
        process.stdout.write(message);
        cursorTo(0, split.length + 2);
    }

    function testFail(test) {
        update(test, "\u001b[31m\u00D7 FAILURE\u001b[39m");
    }


    function testSuccess(test) {
        update(test, "\u001b[32m\u221A\u001b[39m")
    }

    return {
        addTests: addTests,
        testFail: testFail,
        testSuccess: testSuccess
    }
})();

function stringToStream(str) {
    var Readable = require('stream').Readable;
    var readable = new Readable()
    readable.push(str + "");
    readable.push(null);
    return readable;
}

module.exports = {
    checkAscii: checkAscii,
    getLicense: getLicense,
    run: run,
    parseDeps: parseDeps,
    tableLogger: tableLogger,
    stringToStream: stringToStream,
    cursorTo: cursorTo,
    clearScreenDown: clearScreenDown
};
