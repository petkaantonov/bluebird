"use strict";
Error.stackTraceLimit = 100;
var Table = require('cli-table');
var astPasses = require("./ast_passes.js");
var node11 = parseInt(process.versions.node.split(".")[1], 10) >= 11;
var mkdirp = require("mkdirp");
var UglifyJS = require("uglify-js");
var Q = require("q");
Q.longStackSupport = true;

module.exports = function( grunt ) {
    var isCI = !!grunt.option("ci");
    var notAscii = /[^\u0019-\u007E]/;

    function checkAscii(path, contents) {
        contents.split("\n").forEach(function(line, i) {
            if (notAscii.test(line)) {
                var lineNo = i + 1;
                var col = line.indexOf(RegExp.lastMatch) + 1;
                var code = "U+" + (("0000" + line.charCodeAt(col-1)
                                                    .toString(16)).slice(-4));
                code = RegExp.lastMatch + " (" + code.toUpperCase() + ")";
                throw new Error(path +":" + lineNo +":" + col +
                        " Non-ASCII character: " + code);
            }
        });
    }

    function getBrowsers() {
        //Terse format to generate the verbose format required by sauce
        var browsers = {
            "internet explorer|Windows XP": ["7", "8"],
            "firefox|Windows 7": ["3.5", "4", "25", "33"],
            "chrome|Windows 7": ["beta"],
            "safari|Windows 7": ["5"]
        };

        var ret = [];
        for( var browserAndPlatform in browsers) {
            var split = browserAndPlatform.split("|");
            var browser = split[0];
            var platform = split[1];
            var versions = browsers[browserAndPlatform];
            if( versions != null ) {
                for( var i = 0, len = versions.length; i < len; ++i ) {
                    ret.push({
                        browserName: browser,
                        platform: platform,
                        version: versions[i]
                    });
                }
            }
            else {
                ret.push({
                    browserNAme: browser,
                    platform: platform
                });
            }
        }
        return ret;
    }


    var optionalModuleDependencyMap = {
        "timers.js": ['Promise', 'INTERNAL', 'tryConvertToPromise'],
        "race.js": ['Promise', 'INTERNAL', 'tryConvertToPromise'],
        "call_get.js": ['Promise'],
        "generators.js": ['Promise', 'apiRejection', 'INTERNAL', 'tryConvertToPromise'],
        "map.js": ['Promise', 'PromiseArray', 'apiRejection', 'tryConvertToPromise', 'INTERNAL'],
        "nodeify.js": ['Promise'],
        "promisify.js": ['Promise', 'INTERNAL'],
        "props.js": ['Promise', 'PromiseArray', 'tryConvertToPromise'],
        "reduce.js": ['Promise', 'PromiseArray', 'apiRejection', 'tryConvertToPromise', 'INTERNAL'],
        "settle.js": ['Promise', 'PromiseArray'],
        "some.js": ['Promise', 'PromiseArray', 'apiRejection'],
        "any.js": ['Promise', 'PromiseArray'],
        "progress.js": ['Promise', 'PromiseArray'],
        "cancel.js": ['Promise', 'INTERNAL'],
        "filter.js": ['Promise', 'INTERNAL'],
        "each.js": ['Promise', 'INTERNAL'],
        "using.js": ['Promise', 'apiRejection', 'tryConvertToPromise']
    };

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

    function getOptionalRequireCode( srcs ) {
        return srcs.reduce(function(ret, cur, i){
            if( optionalModuleRequireMap[cur] ) {
                ret += "require('./"+cur+"')("+ optionalModuleDependencyMap[cur] +");\n";
            }
            return ret;
        }, "") + "\nPromise.prototype = Promise.prototype;\nreturn Promise;\n";
    }

    function getBrowserBuildHeader( sources ) {
        var header = "/**\n * bluebird build version " + gruntConfig.pkg.version + "\n";
        var enabledFeatures = ["core"];
        var disabledFeatures = [];
        featureLoop: for( var key in optionalModuleRequireMap ) {
            for( var i = 0, len = sources.length; i < len; ++i ) {
                var source = sources[i];
                if( source.fileName === key ) {
                    enabledFeatures.push( key.replace( ".js", "") );
                    continue featureLoop;
                }
            }
            disabledFeatures.push( key.replace( ".js", "") );
        }

        header += ( " * Features enabled: " + enabledFeatures.join(", ") + "\n" );

        if( disabledFeatures.length ) {
            header += " * Features disabled: " + disabledFeatures.join(", ") + "\n";
        }
        header += "*/\n";
        return header;
    }

    function applyOptionalRequires( src, optionalRequireCode ) {
        return src.replace( /};([^}]*)$/, optionalRequireCode + "\n};$1");
    }

    var CONSTANTS_FILE = './src/constants.js';
    var BUILD_DEBUG_DEST = "./js/debug/bluebird.js";

    var license;
    function getLicense() {
        if( !license ) {
            var fs = require("fs");
            var text = fs.readFileSync("LICENSE", "utf8");
            text = text.split("\n").map(function(line, index){
                return " * " + line;
            }).join("\n")
            license = "/**\n" + text + "\n */\n";
        }
        return license
    }

    var preserved;
    function getLicensePreserve() {
        if( !preserved ) {
            var fs = require("fs");
            var text = fs.readFileSync("LICENSE", "utf8");
            text = text.split("\n").map(function(line, index){
                if( index === 0 ) {
                    return " * @preserve " + line;
                }
                return " *" + (line ? " " + line : "");
            }).join("\n")
            preserved = "/**\n" + text + "\n */\n";
        }
        return preserved;
    }

    function writeFile( dest, content ) {
        grunt.file.write( dest, content );
        grunt.log.writeln('File "' + dest + '" created.');
    }

    function writeFileAsync( dest, content ) {
        var fs = require("fs");
        return Q.nfcall(fs.writeFile, dest, content).then(function(){
            grunt.log.writeln('File "' + dest + '" created.');
        });
    }

    var gruntConfig = {};

    var getGlobals = function() {
        var fs = require("fs");
        var file = "./src/constants.js";
        var contents = fs.readFileSync(file, "utf8");
        var rconstantname = /CONSTANT\(\s*([^,]+)/g;
        var m;
        var globals = {
            Error: true,
            args: true,
            INLINE_SLICE: false,
            Promise: true,
            WebKitMutationObserver: true,
            TypeError: true,
            RangeError: true,
            __DEBUG__: false,
            __BROWSER__: false,
            process: true,
            "console": false,
            "require": false,
            "module": false,
            "define": false
        };
        while( ( m = rconstantname.exec( contents ) ) ) {
            globals[m[1]] = false;
        }
        return globals;
    }

    gruntConfig.pkg = grunt.file.readJSON("package.json");

    gruntConfig.jshint = {
        all: {
            options: {
                globals: getGlobals(),

                "bitwise": false,
                "camelcase": true,
                "curly": true,
                "eqeqeq": true,
                "es3": true,
                "forin": true,
                "immed": true,
                "latedef": false,
                "newcap": true,
                "noarg": true,
                "noempty": true,
                "nonew": true,
                "plusplus": false,
                "quotmark": "double",
                "undef": true,
                "unused": true,
                "strict": false,
                "maxparams": 6,
                "maxlen": 80,

                "asi": false,
                "boss": true,
                "eqnull": true,
                "evil": true,
                "expr": false,
                "funcscope": false,
                "globalstrict": false,
                "lastsemic": false,
                "laxcomma": false,
                "laxbreak": false,
                "loopfunc": true,
                "multistr": true,
                "proto": false,
                "scripturl": true,
                "shadow": true,
                "sub": true,
                "supernew": false,
                "validthis": true,

                "browser": true,
                "jquery": true,
                "devel": true,


                '-W014': true,
                '-W116': true,
                '-W106': true,
                '-W064': true,
                '-W097': true
            },

            files: {
                src: [
                    "./src/finally.js",
                    "./src/direct_resolve.js",
                    "./src/synchronous_inspection.js",
                    "./src/thenables.js",
                    "./src/progress.js",
                    "./src/cancel.js",
                    "./src/any.js",
                    "./src/race.js",
                    "./src/join.js",
                    "./src/call_get.js",
                    "./src/filter.js",
                    "./src/generators.js",
                    "./src/map.js",
                    "./src/nodeify.js",
                    "./src/promisify.js",
                    "./src/props.js",
                    "./src/reduce.js",
                    "./src/settle.js",
                    "./src/some.js",
                    "./src/util.js",
                    "./src/schedule.js",
                    "./src/queue.js",
                    "./src/errors.js",
                    "./src/each.js",
                    "./src/captured_trace.js",
                    "./src/async.js",
                    "./src/catch_filter.js",
                    "./src/promise.js",
                    "./src/promise_array.js",
                    "./src/promise_resolver.js",
                    "./src/using.js"
                ]
            }
        }
    };

    if( !isCI ) {
        gruntConfig.jshint.all.options.reporter = require("jshint-stylish");
    }

    gruntConfig.connect = {
        server: {
            options: {
                base: "./test/browser",
                port: 9999
            }
        }
    };

    gruntConfig.watch = {};

    gruntConfig["saucelabs-mocha"] = {
        all: {
            options: {
                urls: ["http://127.0.0.1:9999/index.html"],
                tunnelTimeout: 30,
                build: process.env.TRAVIS_JOB_ID,
                maxPollRetries: 3,
                throttled: 3,
                browsers: getBrowsers(),
                testname: "mocha tests",
                tags: ["master"]
            }
        }
    };

    gruntConfig.bump = {
      options: {
        files: ['package.json'],
        updateConfigs: [],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['-a'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        false: true,
        pushTo: 'master',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
      }
    };

    grunt.initConfig(gruntConfig);
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-saucelabs");
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    function runIndependentTest( file, cb , env) {
        var path = require("path");
        var spawn = require('child_process').spawn;
        var p = path.join(process.cwd(), "test");

        var stdio = [
            'ignore',
            grunt.option("verbose")
                ? process.stdout
                : 'ignore',
            grunt.option("verbose")
                ? process.stderr
                : 'ignore'
        ];
        if (!env && !isCI) env = {singleTest: !!grunt.option("single-test")};
        var flags = node11 ? ["--harmony-generators"] : [];
        flags.push("--allow-natives-syntax");
        if( file.indexOf( "mocha/") > -1 || file === "aplus.js" ) {
            var node = spawn(typeof node11 === "string" ? node11 : 'node',
                flags.concat(["../mocharun.js", file]),
                {cwd: p, stdio: stdio, env: env});
        }
        else {
            var node = spawn('node', flags.concat(["./"+file]),
                             {cwd: p, stdio: stdio, env:env});
        }
        node.on('exit', exit );
        node.on('error', function() {
            exit(-1);
        });

        function exit( code ) {
            var callback = cb;
            cb = function() {};
            if( code !== 0 ) {
                callback(new Error("process didn't exit normally. Code: " + code));
            }
            else {
                callback(null);
            }
        }


    }

    function buildMain( sources, optionalRequireCode ) {
        var fs = require("fs");
        var Q = require("q");
        var root = cleanDirectory("./js/main/");

        return Q.all(sources.map(function( source ) {
            var src = astPasses.removeAsserts( source.sourceCode, source.fileName );
            src = astPasses.inlineExpansion( src, source.fileName );
            src = astPasses.expandConstants( src, source.fileName );
            src = src.replace( /__DEBUG__/g, "false" );
            src = src.replace( /__BROWSER__/g, "false" );
            if( source.fileName === "promise.js" ) {
                src = applyOptionalRequires( src, optionalRequireCode );
            }
            var path = root + source.fileName;
            return writeFileAsync(path, src);
        }));
    }

    function buildDebug( sources, optionalRequireCode ) {
        var fs = require("fs");
        var Q = require("q");
        var root = cleanDirectory("./js/debug/");

        return Q.nfcall(require('mkdirp'), root).then(function(){
            return Q.all(sources.map(function( source ) {
                var src = astPasses.expandAsserts( source.sourceCode, source.fileName );
                src = astPasses.inlineExpansion( src, source.fileName );
                src = astPasses.expandConstants( src, source.fileName );
                src = src.replace( /__DEBUG__/g, "true" );
                src = src.replace( /__BROWSER__/g, "false" );
                if( source.fileName === "promise.js" ) {
                    src = applyOptionalRequires( src, optionalRequireCode );
                }
                var path = root + source.fileName;
                return writeFileAsync(path, src);
            }));
        });
    }

    function buildZalgo( sources, optionalRequireCode ) {
        var fs = require("fs");
        var Q = require("q");
        var root = cleanDirectory("./js/zalgo/");

        return Q.all(sources.map(function( source ) {
            var src = astPasses.removeAsserts( source.sourceCode, source.fileName );
            src = astPasses.inlineExpansion( src, source.fileName );
            src = astPasses.expandConstants( src, source.fileName );
            src = astPasses.asyncConvert( src, "async", "invoke", source.fileName);
            src = src.replace( /__DEBUG__/g, "false" );
            src = src.replace( /__BROWSER__/g, "false" );
            if( source.fileName === "promise.js" ) {
                src = applyOptionalRequires( src, optionalRequireCode );
            }
            var path = root + source.fileName;
            return writeFileAsync(path, src);
        }));
    }

    function buildBrowser( sources ) {
        var path = require("path");
        var fs = require("fs");
        var browserify = require("browserify");
        var b = browserify("./js/main/bluebird.js");
        var root = "./js/browser";
        var dest = path.join(root, "bluebird.js");
        var minDest = path.join(root, "bluebird.min.js");

        var header = getBrowserBuildHeader( sources );

        return Q.nbind(b.bundle, b)({
                detectGlobals: false,
                standalone: "Promise"
        }).then(function(src) {
            return Q.nfcall(require('mkdirp'), root).then(function() {
                return writeFileAsync( dest,
                    getLicensePreserve() + src )
            })
        }).then(function() {
            return Q.nfcall(fs.readFile, dest, "utf8" );
        }).then(function( src ) {
            src = header + src;
            var alias = "\
            ;if (typeof window !== 'undefined' && window !== null) {           \
                window.P = window.Promise;                                     \
            } else if (typeof self !== 'undefined' && self !== null) {         \
                self.P = self.Promise;                                         \
            }";
            src = src + alias;
            return Q.nfcall(fs.writeFile, dest, src );
        }).then(function() {
            var minSrc = getLicensePreserve() + header + UglifyJS.minify(dest, {
                comments: false,
                compress: true
            }).code;
            return writeFileAsync(minDest, minSrc);
        });
    }

    function cleanDirectory(dir) {
        if (isCI) return dir;
        var fs = require("fs");
        require("rimraf").sync(dir);
        mkdirp.sync(dir);
        return dir;
    }

    function getOptionalPathsFromOption( opt ) {
        opt = (opt + "").toLowerCase().split(/\s+/g);
        var ret = optionalPaths.filter(function(v){
            v = v.replace("./src/", "").replace( ".js", "" ).toLowerCase();
            return opt.indexOf(v) > -1;
        });
        var dependencies = {};
        ret.forEach(function(v) {
            v = v.replace("./src/", "").toLowerCase();
            var dependencies = optionalModuleRequireMap[v];
            if (Array.isArray(dependencies)) {
                dependencies.forEach(function(dependency) {
                    if (ret.indexOf(dependency) === -1) {
                        ret.unshift('./src/' + dependency);
                    }
                });
            }
        });
        return ret;
    }

    var optionalPaths = [
        "./src/timers.js",
        "./src/race.js",
        "./src/call_get.js",
        "./src/generators.js",
        "./src/map.js",
        "./src/nodeify.js",
        "./src/promisify.js",
        "./src/props.js",
        "./src/reduce.js",
        "./src/settle.js",
        "./src/some.js",
        "./src/progress.js",
        "./src/cancel.js",
        "./src/filter.js",
        "./src/any.js",
        "./src/each.js",
        "./src/using.js"
    ];

    var mandatoryPaths = [
        "./src/finally.js",
        "./src/es5.js",
        "./src/bluebird.js",
        "./src/thenables.js",
        "./src/assert.js",
        "./src/util.js",
        "./src/schedule.js",
        "./src/queue.js",
        "./src/errors.js",
        "./src/errors_api_rejection.js",
        "./src/captured_trace.js",
        "./src/async.js",
        "./src/catch_filter.js",
        "./src/promise.js",
        "./src/promise_array.js",
        "./src/synchronous_inspection.js",
        "./src/promise_resolver.js",
        "./src/direct_resolve.js",
        "./src/join.js"
    ];



    function build( paths, isCI ) {
        var fs = require("fs");
        astPasses.readConstants(fs.readFileSync(CONSTANTS_FILE, "utf8"), CONSTANTS_FILE);
        if( !paths ) {
            paths = optionalPaths.concat(mandatoryPaths);
        }
        var optionalRequireCode = getOptionalRequireCode(paths.map(function(v) {
            return v.replace("./src/", "");
        }));

        var Q = require("q");

        var promises = [];
        var sources = paths.map(function(v){
            var promise = Q.nfcall(fs.readFile, v, "utf8")
                            .then(function(contents) {
                                checkAscii(v, contents);
                                return contents;
                            });
            promises.push(promise);
            var ret = {};

            ret.fileName = v.replace("./src/", "");
            ret.sourceCode = promise.then(function(v){
                ret.sourceCode = v;
            });
            return ret;
        });

        //Perform common AST passes on all builds
        return Q.all(promises.slice()).then(function(){
            sources.forEach( function( source ) {
                var src = source.sourceCode
                src = astPasses.removeComments(src, source.fileName);
                src = getLicense() + src;
                source.sourceCode = src;
            });

            if( isCI ) {
                return buildDebug( sources, optionalRequireCode );
            }
            else {
                return Q.all([
                    buildMain( sources, optionalRequireCode ).then( function() {
                        return buildBrowser( sources );
                    }),
                    buildDebug( sources, optionalRequireCode ),
                    buildZalgo( sources, optionalRequireCode )
                ]);
            }
        });
    }

    String.prototype.contains = function String$contains( str ) {
        return this.indexOf( str ) >= 0;
    };

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

    function dumpLog() {
        var table = new Table(tableOpts);
        table.push.apply(table, log);
        process.stdout.cursorTo(0, 0);
        table = table.toString();
        process.stdout.write(table);
        var lines = table.split("\n").length + 1;
        process.stdout.cursorTo(0, lines);
    }

    function logFileStatus(file, message, doOutput) {
        if (grunt.option("single-test")) return;
        var index = file.index;
        var row = index % ROWS;
        var column = (index / ROWS) | 0;
        log[row][column] = message;
        if (doOutput !== false) {
            dumpLog();
        }
    }

    function testRun( testOption, jobs ) {
        var fs = require("fs");
        var path = require("path");
        var done = this.async();

        var totalTests = 0;
        var testsDone = 0;
        var failures = 0;
        function testDone(err) {
            if (err) failures++;
            testsDone++;
            if( testsDone >= totalTests ) {
                if (failures > 0) {
                    done(new Error("Some tests failed"));
                } else {
                    done();
                }
            }
        }
        var files;
        if( testOption === "aplus" ) {
            files = fs.readdirSync("test/mocha").filter(function(f){
                return /^\d+\.\d+\.\d+/.test(f);
            }).map(function( f ){
                return "mocha/" + f;
            });
        }
        else {
            files = testOption === "all"
                ? fs.readdirSync('test')
                    .concat(fs.readdirSync('test/mocha')
                        .map(function(fileName){
                            return "mocha/" + fileName
                        })
                    )
                : [testOption + ".js" ];


            if( testOption !== "all" &&
                !fs.existsSync( "./test/" + files[0] ) ) {
                files[0] = "mocha/" + files[0];
            }
        }
        files = files.filter(function(fileName){
            if( !node11 && fileName.indexOf("generator") > -1 ) {
                return false;
            }
            return /\.js$/.test(fileName);
        }).map(function(f){
            return f.replace( /(\d)(\d)(\d)/, "$1.$2.$3" );
        }).map(function(f, i) {
            return {
                name: path.basename(f),
                path: f,
                index: i
            };
        });

        function runFile(file) {
            totalTests++;
            var env = undefined;
            if (file.path.indexOf("bluebird-debug-env-flag") >= 0) {
                env = Object.create(process.env);
                env["BLUEBIRD_DEBUG"] = true;
            }
            runIndependentTest(file.path, function(err) {
                if(err) {
                    logFileStatus(file, file.name + " \u001b[31m\u00D7 FAILURE\u001b[39m");
                    testDone(true);
                } else {
                    logFileStatus(file, file.name + " \u001b[32m\u221A\u001b[39m");
                    testDone(false);
                }
                if( files.length > 0 ) {
                    runFile( files.shift() );
                }
            }, env);
        }

        jobs = Math.min( files.length, jobs );

        if (jobs === 1) {
            grunt.option("verbose", true);
            grunt.option("single-test", true);
        } else {
            process.stdout.cursorTo(0, 0);
            process.stdout.clearScreenDown();
            files.forEach(function(file) {
                logFileStatus(file, file.name + "  ", false);
            });

            dumpLog();
        }

        for( var i = 0; i < jobs; ++i ) {
            runFile(files.shift());
        }
    }

    grunt.registerTask( "build", function() {

        var done = this.async();
        var features = grunt.option("features");
        var paths = null;
        if( features ) {
            paths = getOptionalPathsFromOption( features ).concat( mandatoryPaths );
        }

        build( paths, isCI ).then(function() {
            done();
        }).catch(function(e) {
            function leftPad(count, num) {
                  return (new Array(count + 1).join("0") + num).slice(-count)
            }
            if( e.fileName && e.stack ) {
                var stack = e.stack.split("\n");
                var rLineNo = /\((\d+):(\d+)\)/;
                var match = rLineNo.exec(stack[0]);
                var lineNumber = parseInt(match[1], 10) - 1;
                var columnNumber = parseInt(match[2], 10);
                var padTo = (lineNumber + 5).toString().length;
                var src = e.scriptSrc.split("\n").map(function(v, i) {
                    return leftPad(padTo, (i + 1)) + "  " + v;
                });
                src = src.slice(lineNumber - 5, lineNumber + 5).join("\n") + "\n";
                console.error(src);
                stack[0] = stack[0] + " " + e.fileName;
                console.error(stack.join("\n"));
                if (!grunt.option("verbose")) {
                    console.error("use --verbose to see the source code");
                }

            }
            else {
                console.error(e.stack);
            }
            done(false);
        }).done();
    });

    grunt.registerTask( "testrun", function(){
        var testOption = grunt.option("run");
        var node11path = grunt.option("node11");
        var jobs = parseInt(grunt.option("jobs"), 10);

        if (!isFinite(jobs) || jobs < 1) {
            jobs = 10;
        }

        if (typeof node11path === "string" && node11path) {
            node11 = node11path;
        }

        if( !testOption ) testOption = "all";
        else {
            testOption = ("" + testOption);
            testOption = testOption
                .replace( /\.js$/, "" )
                .replace( /[^a-zA-Z0-9_-]/g, "" );
        }
        testRun.call( this, testOption, jobs );
    });

    grunt.registerTask( "test", ["jshint", "build", "testrun"] );
    grunt.registerTask( "test-browser", ["connect", "saucelabs-mocha"]);
    grunt.registerTask( "default", ["jshint", "build"] );
    grunt.registerTask( "dev", ["connect", "watch"] );

};
