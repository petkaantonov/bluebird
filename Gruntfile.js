module.exports = function( grunt ) {

    var SRC_DEST = './js/promise.js',
        TMP_DEST = './js/tmp.js',
        BUILD_DEST = './js/promise.js',
        MIN_DEST = './js/promise.min.js'

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

    gruntConfig["closure-compiler"] = {
        frontend: {
            closurePath: '../closure_compiler',
            js: TMP_DEST,
            jsOutputFile: MIN_DEST,
            maxBuffer: 8192,
            options: {
                compilation_level: 'SIMPLE_OPTIMIZATIONS',
                language_in: 'ECMASCRIPT5_STRICT',
                charset: "UTF-8",
                debug: false
            },
            noreport: true
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
                "./src/async_call.js",
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
    grunt.loadNpmTasks('grunt-closure-compiler');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask("closure-compiler-fix-strict", function() {
        var fs = require("fs");
        //Fix global strict mode inserted by closure compiler
        var useStrict = "'use strict';";
        var firstFunctionHeaderAfter = '){';
        var src = fs.readFileSync( MIN_DEST, "utf8" );
        src = src.replace(useStrict, "");
        src = src.replace(firstFunctionHeaderAfter, firstFunctionHeaderAfter + '"use strict";' );
        fs.writeFileSync( MIN_DEST, src );
    });

    grunt.registerTask( "build", function() {
        var fs = require("fs");

        var src = fs.readFileSync( SRC_DEST, "utf8" );

        src = replaceConstants(src);
        var devSrc = src.replace( /%_PRODUCTION/g, "false" );
        var prodSrc = src.replace( /%_PRODUCTION/g, "true" );


        fs.writeFileSync( BUILD_DEST, devSrc );
        fs.writeFileSync( TMP_DEST, prodSrc );

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

    grunt.registerTask( "test", ["concat", "build", "jshint", "clean", "testrun"] );
    grunt.registerTask( "default", ["concat", "build", "jshint", "clean"] );
    grunt.registerTask( "production", ["concat", "build", "jshint", "closure-compiler", "closure-compiler-fix-strict","clean"] );

};