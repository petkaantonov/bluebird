module.exports = function run( done ) {
    var fs = require("fs");
    var sys = require('sys');
    var spawn = require('child_process').spawn;
    var path = require("path");
    var node = spawn('node', ["--harmony", "performance.js", "--t", "1", "examples/*.js"], {
        cwd: path.join(process.cwd(), "./benchmark/async-compare" )
    });
    node.stdout.on('data', function( data ) {
        process.stdout.write(data);
    });

    node.stderr.on('data', function( data ) {
        process.stderr.write(data);
    });

    function exit( code ) {
        if( code !== 0 ) {
            throw new Error("process didn't exit normally");
        }
        else {
            done();
        }
    }

    node.on('exit', exit );

};



