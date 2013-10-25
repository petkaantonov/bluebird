"use strict";
Error.stackTraceLimit = 100;
var astPasses = require("./ast_passes.js");
var cc = require("closure-compiler");
var node11 = parseInt(process.versions.node.split(".")[1], 10) >= 11;
var Q = require("q");
Q.longStackSupport = true;

module.exports = function( grunt ) {


    var CONSTANTS_FILE = './src/constants.js';
    var BUILD_DEBUG_DEST = "./js/main/promise.js";

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
                return " * " + line;
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
            TypeError: true,
            __DEBUG__: false,
            process: false,
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
                "trailing": true,
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
                "smarttabs": false,
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
                    "./src/util.js",
                    "./src/schedule.js",
                    "./src/queue.js",
                    "./src/errors.js",
                    "./src/captured_trace.js",
                    "./src/async.js",
                    "./src/thenable.js",
                    "./src/catch_filter.js",
                    "./src/promise.js",
                    "./src/promise_array.js",
                    "./src/settled_promise_array.js",
                    "./src/any_promise_array.js",
                    "./src/some_promise_array.js",
                    "./src/properties_promise_array.js",
                    "./src/promise_inspection.js",
                    "./src/promise_resolver.js",
                    "./src/promise_spawn.js"
                ]
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
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-bump');

    function runIndependentTest( file, cb , env) {
        var fs = require("fs");
        var path = require("path");
        var sys = require('sys');
        var spawn = require('child_process').spawn;
        var p = path.join(process.cwd(), "test");

        var stdio = [
            'ignore',
            grunt.option("verbose")
                ? process.stdout
                : 'ignore',
            process.stderr
        ];
        var flags = node11 ? ["--harmony-generators"] : [];
        if( file.indexOf( "mocha/") > -1 || file === "aplus.js" ) {
            var node = spawn('node', flags.concat(["../mocharun.js", file]),
                             {cwd: p, stdio: stdio, env: env});
        }
        else {
            var node = spawn('node', flags.concat(["./"+file]),
                             {cwd: p, stdio: stdio, env:env});
        }
        node.on('exit', exit );

        function exit( code ) {
            if( code !== 0 ) {
                cb(new Error("process didn't exit normally. Code: " + code));
            }
            else {
                cb(null);
            }
        }


    }

    function buildMain( sources ) {
        var fs = require("fs");
        var Q = require("q");
        var root = "./js/main/";


        return Q.all(sources.map(function( source ) {
            var src = astPasses.removeAsserts( source.sourceCode, source.fileName );
            src = astPasses.expandConstants( src, source.fileName );
            src = src.replace( /__DEBUG__/g, false );

            var path = root + source.fileName;
            return writeFileAsync(path, src);
        }));
    }

    function buildDebug( sources ) {
        var fs = require("fs");
        var Q = require("q");
        var root = "./js/debug/";

        return Q.all(sources.map(function( source ) {
            var src = astPasses.expandAsserts( source.sourceCode, source.fileName );
            src = astPasses.expandConstants( src, source.fileName );
            src = src.replace( /__DEBUG__/g, true );
            var path = root + source.fileName;
            return writeFileAsync(path, src);
        }));
    }

    function buildZalgo( sources ) {
        var fs = require("fs");
        var Q = require("q");
        var root = "./js/zalgo/";

        return Q.all(sources.map(function( source ) {
            var src = astPasses.removeAsserts( source.sourceCode, source.fileName );
            src = astPasses.expandConstants( src, source.fileName );
            src = astPasses.asyncConvert( src, "async", "invoke", source.fileName);
            src = src.replace( /__DEBUG__/g, false );

            var path = root + source.fileName;
            return writeFileAsync(path, src);
        }));
    }

    function buildBrowser() {
        var fs = require("fs");
        var browserify = require("browserify");
        var b = browserify("./js/main/promise.js");

        return Q.nbind(b.bundle, b)({
            detectGlobals: false,
            standalone: "Promise"
        }).then(function(src) {
            return writeFileAsync( "./js/browser/bluebird.js",
                getLicensePreserve() + src )
        });

    }

    function build() {
        var fs = require("fs");
        astPasses.readConstants(fs.readFileSync(CONSTANTS_FILE, "utf8"), CONSTANTS_FILE);
        var paths = [
            "./src/bluebird.js",
            "./src/assert.js",
            "./src/global.js",
            "./src/get_promise.js",
            "./src/util.js",
            "./src/schedule.js",
            "./src/queue.js",
            "./src/errors.js",
            "./src/captured_trace.js",
            "./src/async.js",
            "./src/thenable.js",
            "./src/catch_filter.js",
            "./src/promise.js",
            "./src/promise_array.js",
            "./src/settled_promise_array.js",
            "./src/any_promise_array.js",
            "./src/some_promise_array.js",
            "./src/properties_promise_array.js",
            "./src/promise_inspection.js",
            "./src/promise_resolver.js",
            "./src/promise_spawn.js"
        ];

        var Q = require("q");
        //spion this is why Promise.props is necessary
        var promises = [];
        var sources = paths.map(function(v){
            var promise = Q.nfcall(fs.readFile, v, "utf8");
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
            return Q.all([
                buildMain( sources ).then(buildBrowser),
                buildDebug( sources ),
                buildZalgo( sources )
            ]);
        });
    }

    String.prototype.contains = function String$contains( str ) {
        return this.indexOf( str ) >= 0;
    };

    function isSlowTest( file ) {
        return file.contains("2.3.3") ||
            file.contains("bind") ||
            file.contains("unhandled_rejections");
    }

    function testRun( testOption ) {
        var fs = require("fs");
        var path = require("path");
        var done = this.async();
        var adapter = global.adapter = require(BUILD_DEBUG_DEST);

        var totalTests = 0;
        var testsDone = 0;
        function testDone() {
            testsDone++;
            if( testsDone >= totalTests ) {
                done();
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
        });


        var slowTests = files.filter(isSlowTest);
        files = files.filter(function(file){
            return !isSlowTest(file);
        });

        function runFile(file) {
            totalTests++;
            grunt.log.writeln("Running test " + file );
            var env = undefined;
            if (file.indexOf("bluebird-debug-env-flag") >= 0) {
                env = Object.create(process.env);
                env["BLUEBIRD_DEBUG"] = true;
            }
            runIndependentTest(file, function(err) {
                if( err ) throw new Error(err + " " + file + " failed");
                grunt.log.writeln("Test " + file + " succeeded");
                testDone();
                if( files.length > 0 ) {
                    runFile( files.shift() );
                }
            }, env);
        }

        slowTests.forEach(runFile);

        var maxParallelProcesses = 10;
        var len = Math.min( files.length, maxParallelProcesses );
        for( var i = 0; i < len; ++i ) {
            runFile( files.shift() );
        }
    }

    grunt.registerTask( "build", function() {
        var done = this.async();
        build().then(function(){
            done();
        }).catch(function(e) {
            if( e.fileName && e.stack ) {
                var stack = e.stack.split("\n");
                stack[0] = stack[0] + " " + e.fileName;
                console.error(stack.join("\n"));
            }
            else {
                console.error(e.stack);
            }
            done(false);
        });
    });

    grunt.registerTask( "testrun", function(){
        var testOption = grunt.option("run");
        if( !testOption ) testOption = "all";
        else {
            testOption = ("" + testOption);
            testOption = testOption
                .replace( /\.js$/, "" )
                .replace( /[^a-zA-Z0-9_-]/g, "" );
        }
        testRun.call( this, testOption );
    });

    grunt.registerTask( "test", ["jshint", "build", "testrun"] );
    grunt.registerTask( "default", ["jshint", "build"] );

};
