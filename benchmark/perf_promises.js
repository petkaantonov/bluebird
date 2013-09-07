var args = [
    "async", "mixed", "sync"
];

module.exports = function run( done ) {
    var fs = require("fs");
    var sys = require('sys');
    var spawn = require('child_process').spawn;


    (function runner( args, i){
        if( i >= args.length ) {
            done();
        }
        else {
            var node = spawn('node', ['--expose_gc', './benchmark/perf-promises/promises.perf.js', args[i]]);
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
                    runner( args, i + 1 );
                }
            }

            node.on('exit', exit );

        }
    })(args, 0);
};