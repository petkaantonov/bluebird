var astPasses = require("./ast_passes.js");
var cc = require("closure-compiler");
var node11 = parseInt(process.versions.node.split(".")[1], 10) >= 11;

var ccOptions = {
    compilation_level: 'SIMPLE_OPTIMIZATIONS',
    language_in: 'ECMASCRIPT5_STRICT',
    charset: "UTF-8",
    debug: false,
    jar: '../closure_compiler/build/compiler.jar'
};


var assertionErrorCode = function() {
    var ASSERT = (function(){
        var AssertionError = (function() {
            function AssertionError( a ) {
                this.constructor$( a );
                this.message = a;
                this.name = "AssertionError";
            }
            AssertionError.prototype = new Error();
            AssertionError.prototype.constructor = AssertionError;
            AssertionError.prototype.constructor$ = Error;
            return AssertionError;
        })();

        return function assert( boolExpr, message ) {
            if( boolExpr === true ) return;

            var ret = new AssertionError( message );
            if( Error.captureStackTrace ) {
                Error.captureStackTrace( ret, assert );
            }
            if( console && console.error ) {
                console.error( ret.stack + "" );
            }
            throw ret;

        };
    })();

}.toString()
.replace(/^\s*function\s*\(\s*\)\s\{/, "")
.replace(/}\s*$/, "")
//:D
.replace('(function(){', '(function(){/* jshint -W014, -W116 */');

module.exports = function( grunt ) {




    var SRC_DEST = './js/bluebird.js',
        BUILD_DEBUG_DEST = './js/bluebird_debug.js',
        BUILD_DEST = './js/bluebird.js',
        BUILD_SYNC_DEST = './js/bluebird_sync.js',
        MIN_SYNC_DEST = './js/bluebird_sync.min.js',
        MIN_DEST = './js/bluebird.min.js'

    function writeFile( dest, content ) {
        grunt.file.write( dest, content );
        grunt.log.writeln('File "' + dest + '" created.');
    }

    var gruntConfig = {};

    gruntConfig.pkg = grunt.file.readJSON("package.json");

    gruntConfig.jshint = {
        all: {
            options: {
                jshintrc: "./.jshintrc"
            },

            files: {
                src: [
                    BUILD_DEST,
                    BUILD_DEBUG_DEST
                ]
            }
        }
    };

    gruntConfig.concat = {
        options: {
            separator: '\n'
        },

        dist: {
            src: [
                "./src/prologue.js",
                "./src/util.js",
                "./src/errors.js",
                "./src/captured_trace.js",
                "./src/caches.js",
                "./src/async.js",
                "./src/thenable.js",
                "./src/catch_filter.js",
                "./src/promise.js",
                "./src/promise_array.js",
                "./src/settled_promise_array.js",
                "./src/any_promise_array.js",
                "./src/some_promise_array.js",
                "./src/promise_inspection.js",
                "./src/promise_resolver.js",
                "./src/promise_spawn.js",
                "./src/epilogue.js"
            ],

            nonull: true,

            dest: SRC_DEST
        }

    };

    gruntConfig.watch = {
            scripts: {
            files: [
                "./src/**/*"
            ],
            tasks: ["concat", "build"],
            options: {
              interrupt: true,
              debounceDelay: 2500
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
        push: true,
        pushTo: 'master',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
      }
    };

    grunt.initConfig(gruntConfig);
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-bump');

    function runIndependentTest( file, cb ) {
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
            var node = spawn('node', flags.concat(["../mocharun.js", file]), {cwd: p, stdio: stdio});
        }
        else {
            var node = spawn('node', flags.concat(["./"+file]), {cwd: p, stdio: stdio});
        }
        node.on('exit', exit );

        function exit( code ) {
            if( code !== 0 ) {
                throw new Error("process didn't exit normally");
            }
            else {
                cb(null);
            }
        }


    }

    function fixStrict( code ) {
        //Fix global strict mode inserted by closure compiler
        var useStrict = "'use strict';";
        var firstFunctionHeaderAfter = '){';
        var src = code;
        src = src.replace(useStrict, "");
        src = src.replace(firstFunctionHeaderAfter, firstFunctionHeaderAfter + '"use strict";' );
        return src;
    }

    function build( shouldMinify ) {
        var fs = require("fs");
        var src = fs.readFileSync( SRC_DEST, "utf8" );

        function ccCompleted() {
            runsDone++;
            if( runsDone >= totalCCRuns ) {
                done();
            }
        }

        var totalCCRuns = 2;
        var runsDone = 0;

        if( shouldMinify ) {
            var done = this.async();
        }

        var debugSrc, asyncSrc, syncSrc;

        src = astPasses.removeComments( src );
        debugSrc = assertionErrorCode + (astPasses.expandConstants( astPasses.expandAsserts( src ) )
            .replace( /__DEBUG__/g, 'true'));
        src = astPasses.expandConstants( astPasses.removeAsserts( src ) )
            .replace( /__DEBUG__/g, 'false');

        asyncSrc = src;
        syncSrc = astPasses.asyncConvert( src, "async", "invoke");

        writeFile( BUILD_DEST, asyncSrc );
        writeFile( BUILD_SYNC_DEST, syncSrc );
        writeFile( BUILD_DEBUG_DEST, debugSrc );

        if( shouldMinify ) {
            var ccDone = function( location, err, code ) {
                if( err ) throw err;
                code = fixStrict(code);
                writeFile( location, code );
                ccCompleted();
            };
            cc.compile( asyncSrc, ccOptions, ccDone.bind(0, MIN_DEST) );
            cc.compile( syncSrc, ccOptions, ccDone.bind(0, MIN_SYNC_DEST ) );
        }

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

        for( var i = 0, len = files.length; i < len; ++i ) {
            (function(file, i) {
                totalTests++;
                grunt.log.writeln("Running test " + files[i] );
                runIndependentTest(file, function(err) {
                    if( err ) throw new Error(err + " " + file + " failed");
                    grunt.log.writeln("Test " + files[i] + " succeeded");
                    testDone();
                });
            })(files[i], i);
        }

    }

    function benchmarkRun( benchmarkOption ) {
        var fs = require("fs");
        var path = require("path");
        var done = this.async();
        var files = benchmarkOption === "all"
            ? fs.readdirSync('benchmark')
            : [benchmarkOption + ".js"];

        files = files.filter(function( fileName ){
            return /\.js$/.test(fileName);
        }).map(function(fileName){
            return "./" + path.join( "benchmark", fileName );
        });

        (function runner(files, i){
            if( i >= files.length ) {
                done();
            }
            else {
                var file = files[i];
                grunt.log.writeln("Running benchmark " + file );
                if( file.indexOf( "matcha" ) !== -1 ) {
                    grunt.log.writeln("Run matcha benchmarks with match");
                    runner(files, i + 1 );
                }
                else {
                    require(file)(function(){
                        runner(files, i + 1 );
                    });
                }
            }
        })(files, 0);
    }


    grunt.registerTask( "build-with-minify", function() {
        return build.call( this, true );
    });
    grunt.registerTask( "build", function() {
        var debug = !!grunt.option("debug");
        return build.call( this, false );
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

    grunt.registerTask( "benchrun", function(){
        var benchmarkOption = grunt.option("run");
        if( !benchmarkOption ) benchmarkOption = "all";
        else {
            benchmarkOption = benchmarkOption
                .replace( /\.js$/, "" )
                .replace( /[^a-zA-Z0-9_-]/g, "" );
        }
        benchmarkRun.call( this, benchmarkOption );
    });

    grunt.registerTask( "bench", ["concat", "build", "jshint", "benchrun"] );
    grunt.registerTask( "test", ["concat", "build", "jshint", "testrun"] );
    grunt.registerTask( "default", ["concat", "build", "jshint"] );
    grunt.registerTask( "production", ["concat", "build-with-minify", "jshint"] );

};