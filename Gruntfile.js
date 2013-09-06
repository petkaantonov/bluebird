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


    var SRC_DEST = './js/promise.js',
        BUILD_DEST = './js/promise.js',
        BUILD_SYNC_DEST = './js/promise_sync.js',
        MIN_SYNC_DEST = './js/promise_sync.min.js',
        MIN_DEST = './js/promise.min.js'

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
                "./src/promise_resolver.js",
                "./src/promise.js",
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
            tasks: ["concat", "build", "clean"],
            options: {
              interrupt: true,
              debounceDelay: 2500
            }
        }
    };

    grunt.initConfig(gruntConfig);
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

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

        function ccCompleted() {
            runsDone++;
            if( runsDone >= totalCCRuns ) {
                done();
            }
        }

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


    grunt.registerTask( "build-with-minify", function() {
        return build.call( this, true );
    });
    grunt.registerTask( "build", function() {
        return build.call( this, false );
    });

    grunt.registerTask( "clean", function() {
        var fs = require("fs");
        fs.unlink( TMP_DEST );

    });

    grunt.registerTask( "testrun", function() {
        var done = this.async();
        require("promises-aplus-tests")(require(BUILD_DEST), function(err){
            if( err ) throw err;
            else done();
        });
    });

    grunt.registerTask( "test", ["concat", "build", "jshint", "testrun"] );
    grunt.registerTask( "default", ["concat", "build", "jshint"] );
    grunt.registerTask( "production", ["concat", "build-with-minify", "jshint"] );

};