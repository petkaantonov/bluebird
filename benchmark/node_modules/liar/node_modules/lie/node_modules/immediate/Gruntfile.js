module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            dist: {
                files: {
                    'dist/<%= pkg.name %>.js': ["lib/index.js"],
                },
                options: {
                    standalone: '<%= pkg.name %>'
                }
            }
        },
        uglify: {
            options: {
                report: 'gzip',
                mangle: true
            },
            all: {
                src: "dist/<%= pkg.name %>.js",
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        "saucelabs-mocha":{
            all:{
                options:{
                    username:"cw_immediate",
                    key: "ec5df81d-3ddc-46e6-868f-d9b542937baa",
                    concurrency:3,
                    build: process.env.TRAVIS_JOB_ID,
                    browsers: [
                        {
                            browserName: 'firefox',
                            platform: 'linux',
                            version: '3.6'
                        },
                        {
                            browserName: 'firefox',
                            platform: 'linux',
                            version: '4'
                        },
                        {
                            browserName: 'firefox',
                            platform: 'linux',
                            version: '5'
                        },
                        {
                            browserName: 'firefox',
                            platform: 'linux',
                            version: '17'
                        },
                        {
                            browserName: 'firefox',
                            platform: 'linux',
                            version: '22'
                     /*  },{
                           browserName: 'opera',
                         platform: 'XP',
                //            version: '9'
                  //      },{
                    //        browserName: 'opera',
                      //      platform: 'XP',
                      //      version: '10'
                      //  },{
                            browserName: 'opera',
                            platform: 'XP',
                            version: '11'
                        },{
                            browserName: 'opera',
                            platform: 'XP',
                            version: '12'
                        },{
                            browserName: 'opera',
                            platform: 'win8',
                            version: '9'
                        },{
                            browserName: 'opera',
                            platform: 'win8',
                            version: '10'
                        },{
                            browserName: 'opera',
                            platform: 'win7',
                            version: '9'
                        },{
                            browserName: 'opera',
                            platform: 'win7',
                            version: '10'
                       */ },{
                            browserName: 'opera',
                            platform: 'win7',
                            version: '11'
                       /* },{
                            browserName: 'opera',
                            platform: 'win7',
                            version: '12'
                        },{
                            browserName: 'opera',
                            platform: 'linux',
                            version: '12'
                       */ },{
                            browserName: 'internet explorer',
                            platform: 'WIN8',
                            version: '10'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'WIN7',
                            version: '10'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'WIN7',
                            version: '9'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'WIN7',
                            version: '8'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'XP',
                            version: '8'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'XP',
                            version: '7'
                        },
                     /*   {
                            browserName: 'internet explorer',
                            platform: 'XP',
                            version: '6'
                        },
                       */ {
                            browserName: "safari",
                            platform: "OS X 10.8",
                            version:'6'
                        },
                        {
                            browserName: "safari",
                            platform: "OS X 10.6",
                            version:'5'
                        },
                        {
                            browserName: "iphone",
                            platform: "OS X 10.8",
                            version:'6'
                        },
                        {
                            browserName: "ipad",
                            platform: "OS X 10.8",
                            version:'6'
                        },
                        {
                            browserName: 'chrome',
                            platform: 'XP'
                        },
                        {
                            browserName: 'chrome',
                            platform: 'WIN7'
                        },
                        {
                            browserName: 'chrome',
                            platform: 'WIN8'
                        },
                        {
                            browserName: 'chrome',
                            platform: 'linux'
                        },
                        {
                            browserName: 'chrome',
                            platform: "OS X 10.8"
                        },
                        {
                            browserName: 'chrome',
                            platform: "OS X 10.6"
                        },
                        {
                            platform:'linux',
                            browerName:'android',
                            version:'4.0'
                        }

                    ],
                     urls:[
                        "http://127.0.0.1:8080/test/index.html"
                    ]
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 8080,
                    base: '.'
                }
            }
        },
        jshint: {
                options:{
                        jshintrc: "./.jshintrc"
                },
                all: ['lib/*.js']
        }
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-saucelabs');
    grunt.registerTask('test', ['default','connect', 'saucelabs-mocha']);
    grunt.registerTask('default', ['browserify', 'uglify']);
}
