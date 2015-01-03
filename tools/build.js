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
    "progress.js": true,
    "cancel.js": true,
    "using.js": true,
    "filter.js": ["map.js"],
    "any.js": ["some.js"],
    "each.js": ["reduce.js"],
    "timers.js": ["cancel.js"]
};


function getOptionalRequireCode(srcs) {
    return srcs.sort(function(a, b) {
        var deps = optionalModuleRequireMap[a.sourceFileName];
        if (deps !== undefined) {
            if (Array.isArray(deps)) {
                return 1;
            } else {
                return -1;
            }
        }
        return 0;
    }).reduce(function(ret, cur, i) {
        if(optionalModuleRequireMap[cur.sourceFileName]) {
            ret += "require('./"+cur.sourceFileName+"')("+ cur.deps.join(", ") +");\n";
        }
        return ret;
    }, "") + "\nPromise.prototype = Promise.prototype;\nreturn Promise;\n";
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

function ensureDirectory(dir, isUsed) {
    return rimraf(dir).then(function() {
        if (!isUsed) return dir;
        return mkdirp(dir).thenReturn(dir);
    });
}

function buildMain(sources, depsRequireCode, dir) {
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

function buildZalgo(sources, depsRequireCode, dir) {
    return dir.then(function(dir) {
        return Promise.map(sources, function(source) {
            return jobRunner.run(function() {
                var code = source.source;
                var sourceFileName = source.sourceFileName;
                code = astPasses.removeAsserts(code, sourceFileName);
                code = astPasses.inlineExpansion(code, sourceFileName);
                code = astPasses.expandConstants(code, sourceFileName);
                code = astPasses.asyncConvert(code, "async", "invoke", sourceFileName);
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

function buildBrowser(sources, dir, minify, npmPackage, license) {
    return Promise.join(dir, npmPackage, license, function(dir, npmPackage, license) {
        var header = getBrowserBuildHeader(sources, npmPackage);
        return jobRunner.run(function() {
            var UglifyJS = require("uglify-js");
            var browserify = require("browserify");
            var dest = path.join(root, "bluebird.js");
            var minDest = path.join(root, "bluebird.min.js");
            var b = browserify({
                entries: "./js/main/bluebird.js",
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
                var minWrite, write;
                if (minify) {
                    var minSrc = UglifyJS.minify(src, {
                        comments: false,
                        compress: true,
                        fromString: true
                    }).code;
                    minSrc  = license + header + minSrc;
                    minWrite = fs.writeFileAsync(minDest, minSrc);
                }
                src = license + header + src;
                write = fs.writeFileAsync(dest, src);

                return Promise.all([write, minWrite]);
            })
        }, {
            context: {
                header: header,
                root: dir,
                license: license,
                minify: minify
            }
        })
    });
}

function build(options) {
    var npmPackage = fs.readFileAsync("./package.json").then(JSON.parse);
    var sourceFileNames = getSourcePaths(options.features);
    var license = utils.getLicense();
    var mainDir = ensureDirectory("./js/main", options.main);
    var debugDir = ensureDirectory("./js/debug", options.debug);
    var zalgoDir = ensureDirectory("./js/zalgo", options.zalgo);
    var browserDir = ensureDirectory("./js/browser", options.main && options.browser);
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
        var main, debug, zalgo, browser;
        if (options.main)
            main = buildMain(results, depsRequireCode, mainDir);
        if (options.debug)
            debug = buildDebug(results, depsRequireCode, debugDir);
        if (options.zalgo)
            zalgo = buildZalgo(results, depsRequireCode, zalgoDir);
        if (options.main && options.browser)
            browser = main.then(function() {
                return buildBrowser(results, browserDir, options.minify, npmPackage, license);
            });
        return Promise.all([main, debug, zalgo, browser]);
    });
}

module.exports = build;


if (require.main === module) {
    var argv = require("optimist").argv;
    var browser = (typeof argv.browser !== "boolean" ? false : argv.browser) || !!argv.features;
    module.exports({
        minify: browser && (typeof argv.minify !== "boolean" ? true : argv.minify),
        browser: browser,
        debug: (typeof argv.debug !== "boolean" ? true : argv.debug),
        main: (typeof argv.main !== "boolean" ? false : argv.main) || browser,
        zalgo: !!argv.zalgo,
        features: argv.features || null
    });
}
