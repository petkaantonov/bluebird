var banner = '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %>*/\n/*! (c)2013 Ruben Verborgh & Calvin Metcalf @license MIT https://github.com/calvinmetcalf/lie*/';
//"component build -o dist -n lie -s deferred"
var test = require('./test/adapter');
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        component: {
            build:{
            options: {
                args: {
                    out: 'dist',
                    name: '<%= pkg.name %>',
                    //"no-require":true,
                    standalone:'promise'
                }
            }},
            noConflict:{options: {
                args: {
                    out: 'dist',
                    name: '<%= pkg.name %>.noConflict',
                    //"no-require":true,
                    standalone:'lie'
                }
            }}
        },
        uglify: {
            options: {
                banner: banner,
                report: 'gzip',
                mangle: {
                    except: ['Promise']
                }
            },
            all: {
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
    grunt.loadNpmTasks('grunt-component');
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
    grunt.registerTask('default', ['jshint','component:build','component:noConflict','uglify','test']);
};
