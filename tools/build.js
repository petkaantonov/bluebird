var Promise = require("bluebird");
var path = require("path");
var jobRunner = require("./job-runner/job-runner.js");
Promise.longStackTraces();
var utils = require("./utils.js");
var glob = Promise.promisify(require("glob"));
var fs = Promise.promisifyAll(require("fs"));
var mkdirp = Promise.promisify(require("mkdirp"));
var rimraf = Promise.promisify(require("rimraf"));

jobRunner.init(path.join(__dirname, ".."), function() {
    var fs = Promise.promisifyAll(require("fs"));
    var utils = require("./tools/utils.js");
    var path = require("path");
    var astPasses = require("./tools/ast_passes.js");
    var Mocha = require("mocha");
    astPasses.readConstants(
        fs.readFileSync("./src/constants.js", "utf8"),
        "constants.js"
    );
    function applyOptionalRequires(code, depsRequireCode) {
        return code.replace( /};([^}]*)$/, depsRequireCode + "\n};$1");
    }
});

var optionalModuleRequireMap = {
    "race.js": true,
    "call_get.js": true,
    "generators.js": true,
    "map.js": true,
    "nodeify.js": true,
    "promisify.js": true,
    "props.js": true,
    "reduce.js": true,
    "settle.js": true,
    "some.js": true,
    "using.js": true,
    "timers.js": true,
    "filter.js": ["map.js"],
    "any.js": ["some.js"],
    "each.js": ["reduce.js"]
};

var lastLineCode = "                                                         \n\
    util.toFastProperties(Promise);                                          \n\
    util.toFastProperties(Promise.prototype);                                \n\
    function fillTypes(value) {                                              \n\
        var p = new Promise(INTERNAL);                                       \n\
        p._fulfillmentHandler0 = value;                                      \n\
        p._rejectionHandler0 = value;                                        \n\
        p._promise0 = value;                                                 \n\
        p._receiver0 = value;                                                \n\
    }                                                                        \n\
    // Complete slack tracking, opt out of field-type tracking and           \n\
    // stabilize map                                                         \n\
    fillTypes({a: 1});                                                       \n\
    fillTypes({b: 2});                                                       \n\
    fillTypes({c: 3});                                                       \n\
    fillTypes(1);                                                            \n\
    fillTypes(function(){});                                                 \n\
    fillTypes(undefined);                                                    \n\
    fillTypes(false);                                                        \n\
    fillTypes(new Promise(INTERNAL));                                        \n\
    debug.setBounds(Async.firstLineError, util.lastLineError);               \n\
    return Promise;                                                          \n\
";

function getOptionalRequireCode(srcs) {
    return srcs.sort(function(a, b) {
        var aHasDeps = Array.isArray(optionalModuleRequireMap[a.sourceFileName]);
        var bHasDeps = Array.isArray(optionalModuleRequireMap[b.sourceFileName]);
        return aHasDeps - bHasDeps;
    }).reduce(function(ret, cur, i) {
        if(optionalModuleRequireMap[cur.sourceFileName]) {
            ret += "require('./"+cur.sourceFileName+"')("+ cur.deps.join(", ") +");\n";
        }
        return ret;
    }, "") +  lastLineCode;
}

function getBrowserBuildHeader(sources, npmPackage) {
    var header = "/**\n * bluebird build version " + npmPackage.version + "\n";
    var enabledFeatures = ["core"];
    var disabledFeatures = [];
    featureLoop: for (var key in optionalModuleRequireMap) {
        for (var i = 0, len = sources.length; i < len; ++i) {
            var source = sources[i];
            if(source.sourceFileName === key) {
                enabledFeatures.push(key.replace( ".js", ""));
                continue featureLoop;
            }
        }
        disabledFeatures.push(key.replace(".js", ""));
    }

    header += (" * Features enabled: " + enabledFeatures.join(", ") + "\n");

    if (disabledFeatures.length) {
        header += " * Features disabled: " + disabledFeatures.join(", ") + "\n";
    }
    header += "*/\n";
    return header;
}

function getSourcePaths(features) {
    return glob("./src/*.js").map(function(v) {
        return path.basename(v);
    }).then(function(results) {
        if (features) features = features.toLowerCase().split(/\s+/g);
        return results.filter(function(fileName) {
            if (features && optionalModuleRequireMap[fileName] !== undefined) {
                for (var i = 0; i < features.length; ++i) {
                    if (fileName.indexOf(features[i]) >= 0) {
                        return true;
                    }
                }
                return false;
            }
            return fileName !== "constants.js";
        });
    });
}

function ensureDirectory(dir, isUsed, clean) {
    return (clean ? rimraf(dir) : Promise.resolve()).then(function() {
        if (!isUsed) return dir;
        return mkdirp(dir).thenReturn(dir);
    });
}

function buildRelease(sources, depsRequireCode, dir) {
    return dir.then(function(dir) {
        return Promise.map(sources, function(source) {
            return jobRunner.run(function() {
                var code = source.source;
                var sourceFileName = source.sourceFileName;
                code = astPasses.removeAsserts(code, sourceFileName);
                code = astPasses.inlineExpansion(code, sourceFileName);
                code = astPasses.expandConstants(code, sourceFileName);
                code = code.replace( /__DEBUG__/g, "false" );
                code = code.replace( /__BROWSER__/g, "false" );
                if (sourceFileName === "promise.js") {
                    code = applyOptionalRequires(code, depsRequireCode);
                }
                return fs.writeFileAsync(path.join(root, sourceFileName), code);
            }, {
                context: {
                    depsRequireCode: depsRequireCode,
                    source: source,
                    root: dir
                }
            });
        });
    });
}

function buildDebug(sources, depsRequireCode, dir) {
    return dir.then(function(dir) {
        return Promise.map(sources, function(source) {
            return jobRunner.run(function() {
                var code = source.source;
                var sourceFileName = source.sourceFileName;
                code = astPasses.expandAsserts(code, sourceFileName);
                code = astPasses.inlineExpansion(code, sourceFileName);
                code = astPasses.expandConstants(code, sourceFileName);
                code = code.replace( /__DEBUG__/g, "true" );
                code = code.replace( /__BROWSER__/g, "false" );
                if (sourceFileName === "promise.js") {
                    code = applyOptionalRequires(code, depsRequireCode);
                }
                return fs.writeFileAsync(path.join(root, sourceFileName), code);
            }, {
                context: {
                    depsRequireCode: depsRequireCode,
                    source: source,
                    root: dir
                }
            });
        });
    });
}

function buildBrowser(sources, dir, tmpDir, depsRequireCode, minify, npmPackage, license) {
    return Promise.join(dir, tmpDir, npmPackage, license, function(dir, tmpDir, npmPackage, license) {
        return Promise.map(sources, function(source) {
            return jobRunner.run(function() {
                var code = source.source;
                var sourceFileName = source.sourceFileName;
                code = astPasses.removeAsserts(code, sourceFileName);
                code = astPasses.inlineExpansion(code, sourceFileName, true);
                code = astPasses.expandConstants(code, sourceFileName);
                code = code.replace( /__BROWSER__/g, "true" );
                if (sourceFileName === "promise.js") {
                    code = applyOptionalRequires(code, depsRequireCode);
                }
                return fs.writeFileAsync(path.join(root, sourceFileName), code);
            }, {
                context: {
                    depsRequireCode: depsRequireCode,
                    source: source,
                    root: tmpDir
                }
            });
        }).then(function() {
            var header = getBrowserBuildHeader(sources, npmPackage);
            return jobRunner.run(function() {
                var UglifyJS = require("uglify-js");
                var browserify = require("browserify");
                var dest = path.join(root, "bluebird.js");
                var minDest = path.join(root, "bluebird.min.js");
                var b = browserify({
                    entries: entries,
                    detectGlobals: false,
                    standalone: "Promise"
                });
                return Promise.promisify(b.bundle, b)().then(function(src) {
                    var alias = "\
                    ;if (typeof window !== 'undefined' && window !== null) {       \
                        window.P = window.Promise;                                 \
                    } else if (typeof self !== 'undefined' && self !== null) {     \
                        self.P = self.Promise;                                     \
                    }";
                    src = src + alias;
                    src = src.replace(/\brequire\b/g, "_dereq_");
                    var minWrite, write;
                    if (minify) {
                        var minSrc = src.replace( /__DEBUG__/g, "false" );
                        minSrc = UglifyJS.minify(minSrc, {
                            comments: false,
                            compress: true,
                            fromString: true
                        }).code;
                        minSrc  = license + header + minSrc;
                        minWrite = fs.writeFileAsync(minDest, minSrc);
                    }
                    src = src.replace( /__DEBUG__/g, "true" );
                    src = license + header + src;
                    write = fs.writeFileAsync(dest, src);

                    return Promise.all([write, minWrite]);
                })
            }, {
                context: {
                    header: header,
                    root: dir,
                    entries: path.join(tmpDir, "bluebird.js"),
                    license: license,
                    minify: minify
                }
            })
        });
    });
}

var root = process.cwd();
// Since rm -rf is called, better be sure...
if (path.basename(root).toLowerCase() !== "bluebird") {
    throw new Error("cwd must be se to bluebird project root. Cwd is currently\n\n" +
        "         " + process.cwd() + "\n");
}
var dirs = {
    release: path.join(root, "js", "release"),
    debug: path.join(root, "js", "debug"),
    browser: path.join(root, "js", "browser"),
    browserTmp: path.join(root, "js", "tmp"),
    instrumented: path.join(root, "js", "instrumented"),
    coverage: path.join(root, "coverage")
};

function build(options) {
    options = Object(options);
    var clean = (typeof options.clean !== "boolean" ? true : options.clean);
    var npmPackage = fs.readFileAsync("./package.json").then(JSON.parse);
    var sourceFileNames = getSourcePaths(options.features);
    var license = utils.getLicense();
    var releaseDir = ensureDirectory(dirs.release, options.release, clean);
    var debugDir = ensureDirectory(dirs.debug, options.debug, clean);
    var browserDir = ensureDirectory(dirs.browser, options.browser, clean);
    var browserTmpDir = ensureDirectory(dirs.browserTmp, options.browser, clean);
    return license.then(function(license) {
        return sourceFileNames.map(function(sourceFileName) {
            return jobRunner.run(function() {
                var sourcePath = path.join("./src", sourceFileName);
                var source = fs.readFileAsync(sourcePath, "utf8");
                return source.then(function(source) {
                    utils.checkAscii(sourceFileName, source);
                    var deps = null;
                    if (optionalModuleRequireMap[sourceFileName] !== undefined) {
                        deps = utils.parseDeps(source);
                    }
                    source = astPasses.removeComments(source, sourceFileName);
                    return {
                        sourceFileName: sourceFileName,
                        source: source,
                        deps: deps
                    };
                });
            }, {
                context: {
                    sourceFileName: sourceFileName,
                    optionalModuleRequireMap: optionalModuleRequireMap,
                    license: license
                }
            });
        });
    }).then(function(results) {
        var depsRequireCode = getOptionalRequireCode(results);
        var release, debug, browser;
        if (options.release)
            release = buildRelease(results, depsRequireCode, releaseDir);
        if (options.debug)
            debug = buildDebug(results, depsRequireCode, debugDir);
        if (options.browser)
            browser = buildBrowser(results, browserDir, browserTmpDir, depsRequireCode, options.minify, npmPackage, license);

        return Promise.all([release, debug, browser]);
    });
}

module.exports = build;
module.exports.ensureDirectory = ensureDirectory;
module.exports.dirs = dirs;


if (require.main === module) {
    var argv = require("optimist").argv;
    var browser = (typeof argv.browser !== "boolean" ? false : argv.browser) || !!argv.features;
    var clean = (typeof argv.clean !== "boolean" ? true : argv.clean);
    module.exports({
        minify: browser && (typeof argv.minify !== "boolean" ? true : argv.minify),
        browser: browser,
        debug: !!argv.debug,
        release: !!argv.release,
        features: argv.features || null,
        clean: clean
    });
}
