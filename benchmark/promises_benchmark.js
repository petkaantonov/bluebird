var files = [
    "./benchmark/promises-benchmark/scenarios/serial/index.js",
    "./benchmark/promises-benchmark/scenarios/light-serial/index.js",
    "./benchmark/promises-benchmark/scenarios/parallel/index.js"
];

module.exports = function run( done ) {
    var fs = require("fs");
    var sys = require('sys');
    var spawn = require('child_process').spawn;


    (function runner( files, i){
        if( i >= files.length ) {
            done();
        }
        else {
            var node = spawn('node', [files[i]]);
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
                    runner( files, i + 1 );
                }
            }

            node.on('exit', exit );
            node.on('close', exit );

        }
    })(files, 0);
};