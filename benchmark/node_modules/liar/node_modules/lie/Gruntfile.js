var banner = '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %>*/\n/*! (c)2013 Ruben Verborgh & Calvin Metcalf @license MIT https://github.com/calvinmetcalf/lie*/';
//"component build -o dist -n lie -s deferred"
var test = require('./test/adapter');
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
            browserify: {
                build: {
                    files: {
                        'dist/<%= pkg.name %>.js': ["lib/lie.js"],
                    },
                    options: {
                        standalone: 'promise'
                    }
                },
                noConflict:{
                    files: {
                        'dist/<%= pkg.name %>.noConflict.js': ["lib/lie.js"],
                    },
                    options: {
                        standalone: '<%= pkg.name %>'
                    }
                }
        },
        uglify: {
            all: {
                 options: {
                banner: banner,
                report: 'gzip',
                mangle: {
                    except: ['Promise']
                }
            },
                src: 'dist/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        jshint: {
            options: {
                jshintrc: "./.jshintrc"
            },
            all: ['./lib/<%= pkg.name %>.js']
        }

    });
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
     grunt.registerTask('test',function(){
         var done = this.async();
         test(function(err){
             if(err){
                 grunt.log.error(err);
             }
             done();
         });
     });
    grunt.registerTask('default', ['jshint','browserify:build','browserify:noConflict','uglify','test']);
};
