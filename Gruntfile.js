var asyncConverter = require("./async_converter.js");
var cc = require("closure-compiler");

var ccOptions = {
    compilation_level: 'SIMPLE_OPTIMIZATIONS',
    language_in: 'ECMASCRIPT5_STRICT',
    charset: "UTF-8",
    debug: false,
    jar: '../closure_compiler/build/compiler.jar'
};

module.exports = function( grunt ) {


    var SRC_DEST = './js/bluebird.js',
        BUILD_DEST = './js/bluebird.js',
        BUILD_SYNC_DEST = './js/bluebird_sync.js',
        MIN_SYNC_DEST = './js/bluebird_sync.min.js',
        MIN_DEST = './js/bluebird.min.js'

    function writeFile( dest, content ) {
        grunt.file.write( dest, content );
        grunt.log.writeln('File "' + dest + '" created.');
    }

    function asyncConvert( src ) {
        var results = asyncConverter( src, "async", "invoke" );
        if( results.length ) {
            var ret = "";
            var start = 0;
            for( var i = 0, len = results.length; i < len; ++i ) {
                var item = results[i];
                ret += src.substring( start, item.start );
                ret += item.toString();
                start = item.end;
            }
            ret += src.substring( start );
            return ret;
        }
        return src;
    }

    function replaceConstants( src ) {
        var rconstant = /%constant\s*\(\s*([a-zA-Z0-9$_]+)\s*,\s*(.+)\s*\)\s*;/ig;
        var constants = [];
        var m;

        while( ( m = rconstant.exec(src) ) !== null ) {

            constants.push({
                regex: new RegExp("\\b" + m[1].replace(/\$/g, "\\$") + "\\b", "g"),
                replace: m[2],
                startIndex: rconstant.lastIndex - m[0].length,
                endIndex: rconstant.lastIndex
            });
        }

        if( constants.length ) {

            var ret = "";
            var start = 0;
            for( var i = 0, len = constants.length; i < len; ++i ) {
                var constant = constants[i];
                ret += src.substring( start, constant.startIndex );
                start = constant.endIndex;
            }
            ret += src.substring( start );
            for( var i = 0, len = constants.length; i < len; ++i ) {
                ret = ret.replace( constants[i].regex, constants[i].replace );
            }

            return ret;
        }
        return src;
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
                    BUILD_DEST
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
                "./src/caches.js",
                "./src/async.js",
                "./src/promise.js",
                "./src/promise_array.js",
                "./src/settled_promise_array.js",
                "./src/any_promise_array.js",
                "./src/some_promise_array.js",
                "./src/promise_inspection.js",
                "./src/promise_resolver.js",
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
        commitFiles: ['package.json'], // '-a' for all files
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

    function runIndependent( file, cb ) {
    var fs = require("fs");
    var sys = require('sys');
    var spawn = require('child_process').spawn;
    var node = spawn('node', ["./"+file]);
    node.stdout.on('data', function( data ) {
        process.stdout.write(data);
    });

    node.stderr.on('data', function( data ) {
        process.stderr.write(data);
    });

    function exit( code ) {
        if( code !== 0 ) {
            cb(new Error("process didn't exit normally"));
        }
        else {
            cb(null);
        }
    }

    node.on('exit', exit );
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

        var transformations = [{
            srcTransformations: [replaceConstants],
            output: BUILD_DEST,
            outputMin: MIN_DEST
        }, {
            continuePrevTransformation: true,
            srcTransformations: [asyncConvert],
            output: BUILD_SYNC_DEST,
            outputMin: MIN_SYNC_DEST
        }];

        function ccCompleted() {
            runsDone++;
            if( runsDone >= totalCCRuns ) {
                done();
            }
        }

        var totalCCRuns = transformations.length;
        var runsDone = 0;

        if( shouldMinify ) {
            var done = this.async();
        }


        for( var i = 0, len = transformations.length; i < len; ++i ) {
            var transformation = transformations[i];
            var srcTransformations = transformation.srcTransformations;
            var prevSrc = transformation.continuePrevTransformation && i > 0 ? prevSrc : src;
            srcTransformations.forEach(function( fn ) {
                prevSrc = fn(prevSrc);
            });
            var output = transformation.output;
            var outputMin = transformation.outputMin;
            writeFile( output, prevSrc );

            if( shouldMinify ) {
                cc.compile( prevSrc, ccOptions, (function( location ){

                    return function( err, code ) {
                        if( err ) throw err;
                        code = fixStrict(code);
                        writeFile( location, code );
                        ccCompleted();
                    };

                })(outputMin));
            }
        }
    }

    function testRun( testOption ) {
        var Mocha = require("mocha");
        var mochas = [];
        var mochaOpts = {
            reporter: "spec",
            timeout: 200,
            slow: Infinity
        };

        var fs = require("fs");
        var path = require("path");
        var done = this.async();
        var adapter = global.adapter = require(BUILD_DEST);

        if( testOption === "aplus" ) {
            grunt.log.writeln("Running Promises/A+ conformance tests");
            require("promises-aplus-tests")(adapter, function(err){
                if( err ) throw new Error(err + " tests failed");
                else done();
            });
            return;
        }


        var files = testOption === "all"
            ? fs.readdirSync('test')
            : [testOption + ".js" ];

        files = files.filter(function(fileName){
            return /\.js$/.test(fileName);
        });

        files.forEach(function(fileName) {
            var a = new Mocha(mochaOpts);
            a.addFile( path.join('test', fileName ));
            mochas.push( a );
        });


        (function runner(mochas, i){

            if( i >= mochas.length ) {
                if( testOption === "all" || testOption === "aplus" ) {
                    grunt.log.writeln("Running Promises/A+ conformance tests");
                    require("promises-aplus-tests")(adapter, function(err){
                        if( err ) throw new Error(err + " tests failed");
                        else done();
                    });
                }
            }
            else {
                grunt.log.writeln("Running test " + files[i] );
                mochas[i].run(function(err){

                    if( err ) throw new Error(err + " tests failed");
                    var suite = mochas[i].suite;
                    if( suite.suites.length === 0 &&
                        suite.tests.length === 0 ) {
                        runIndependent(mochas[i].files[0], function(err) {
                            if( err ) throw err;
                            setTimeout(function(){
                                runner( mochas, i + 1 );
                            }, 500);
                        });
                    }
                    else {
                        setTimeout(function(){
                            runner( mochas, i + 1 );
                        }, 500);
                    }
                });
            }


        })(mochas, 0);
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
                grunt.log.writeln("Running benchmark " + files[i] );
                require(files[i])(function(){
                    runner(files, i + 1 );
                });
            }
        })(files, 0);
    }

    grunt.registerTask( "build-with-minify", function() {
        return build.call( this, true );
    });
    grunt.registerTask( "build", function() {
        return build.call( this, false );
    });

    grunt.registerTask( "testrun", function(){
        var testOption = grunt.option("run");
        if( !testOption ) testOption = "all";
        else {
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